package metadata_test

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.uber.org/zap/zaptest"

	"metadata-reader/metadata"
	"metadata-reader/queue"
)

func TestRead(t *testing.T) {
	stubDb := dbStub{}
	mux := http.NewServeMux()
	ts := httptest.NewServer(mux)
	defer ts.Close()

	s, err := metadata.NewService(zaptest.NewLogger(t), metadata.Config{
		Gateway: ts.URL + "/",
		Timeout: 5,
	}, &stubDb, nil)
	if err != nil {
		t.Fatalf("cannot create metadata service: %v", err)
	}

	t.Run("data protocol", func(t *testing.T) {
		requeue, err := s.Read(context.Background(), queue.MetadataMessage{
			TokenURI: "data:application/text;base64," + base64.StdEncoding.EncodeToString([]byte("hello world")),
		})
		if err != nil {
			t.Errorf("cannot read data: %v", err)
		}
		if requeue {
			t.Error("requeue returned true")
		}
		if stubDb.call.Metadata != "hello world" {
			t.Errorf(`wanted: %s got: "hello world"`, stubDb.call.Metadata)
		}
	})

	t.Run("error on decoding data", func(t *testing.T) {
		_, err := s.Read(context.Background(), queue.MetadataMessage{
			TokenURI: "data:application/text;base64,invalid base64 message",
		})

		if fmt.Sprintf("%s", err) != "illegal base64 data at input byte 7" {
			t.Errorf("expected specific error but got %v", err)
		}
	})

	t.Run("ipfs protocol", func(t *testing.T) {
		mux.HandleFunc("/test-url", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprint(w, "test-url-content")
		})
		_, err := s.Read(context.Background(), queue.MetadataMessage{
			TokenURI: "ipfs://test-url",
		})
		if err != nil {
			t.Errorf("cannot read from ipfs: %v", err)
		}

		if stubDb.call.Metadata != "test-url-content" {
			t.Errorf("wanted: test-url-content got: %s", stubDb.call.Metadata)
		}
	})

	t.Run("https protocol", func(t *testing.T) {
		mux.HandleFunc("/test-https-url", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprint(w, "test-https-url-content")
		})
		_, err := s.Read(context.Background(), queue.MetadataMessage{
			TokenURI: "https://ipfs.io/ipfs/test-https-url",
		})
		if err != nil {
			t.Errorf("cannot read from https: %v", err)
		}
		if stubDb.call.Metadata != "test-https-url-content" {
			t.Errorf("wanted: test-https-url-content got: %s", stubDb.call.Metadata)
		}
	})
}

type dbStub struct {
	call metadata.Metadata
}

func (d *dbStub) InsertOrUpdate(ctx context.Context, m metadata.Metadata) error {
	d.call = m
	return nil
}

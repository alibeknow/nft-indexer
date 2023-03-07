package queue_test

import (
	"context"
	"errors"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
	"golang.org/x/sync/errgroup"

	"metadata-reader/queue"
)

func TestQueueMessages(t *testing.T) {
	var got []queue.MetadataMessage
	ctx, cancel := context.WithCancel(context.Background())
	observedZapCore, observedLogs := observer.New(zap.InfoLevel)
	observedLogger := zap.New(observedZapCore)
	handler := func(ctx context.Context, m queue.MetadataMessage) (bool, error) {
		got = append(got, m)
		return false, nil
	}

	host := os.Getenv("RABBIT_HOST")
	if host == "" {
		host = "localhost"
	}
	port, err := strconv.Atoi(os.Getenv("RABBIT_PORT"))
	if err != nil {
		port = 5672
	}

	config := testConfig{
		queue.Config{
			Protocol: "amqp",
			Host:     host,
			Port:     port,
			Username: "guest",
			Password: "guest",
			Name:     "nft-indexer-test-" + uuid.NewString(),
			Workers:  1,
		},
	}
	// need to call at end as the worker creates the queue when it spawns
	defer config.Tidy(t)

	l, err := queue.NewListener(observedLogger, config.Config, handler)
	if err != nil {
		t.Fatalf("cannot create listener: %v", err)
	}

	eg := errgroup.Group{}
	eg.Go(func() error {
		return l.Run(ctx)
	})

	validMsg := `{
		"pattern": "test-pattern",
		"data": {
			"blockchainName": "chain",
			"blockNumber": 12345,
			"contractAddress": "0x1",
			"contractType": "test",
			"tokenID": "0x2",
			"tokenURI": "http://www.google.com"
		}
	}`
	publish(ctx, t, config, validMsg)

	invalidMsg := `{
		"pattern": 5
	}`
	publish(ctx, t, config, invalidMsg)

	want := queue.MetadataMessage{
		Blockchain:      "chain",
		BlockNumber:     12345,
		ContractAddress: "0x1",
		ContractType:    "test",
		TokenID:         "0x2",
		TokenURI:        "http://www.google.com",
	}

	time.Sleep(200 * time.Millisecond)
	cancel()

	err = eg.Wait()
	if !errors.Is(err, context.Canceled) {
		t.Errorf("unexpected error returned: %s expected: %s", err.Error(), context.Canceled)
	}

	if len(got) != 1 {
		t.Fatalf("got: %d log wanted: 1", len(got))
	}

	if !cmp.Equal(want, got[0]) {
		t.Errorf("got: %v wanted: %v", got[0], want)
	}

	logs := observedLogs.TakeAll()
	if len(logs) != 1 {
		t.Fatalf("got: %d log wanted: 1", len(logs))
	}

	if logs[0].Message != "Decoding event has been failed" {
		t.Errorf(`got: %s wanted: "Decoding event has been failed"`, logs[0].Message)
	}
}

func TestQueueRecreateOnClose(t *testing.T) {
	var got []queue.MetadataMessage
	ctx, cancel := context.WithCancel(context.Background())
	observedZapCore, observedLogs := observer.New(zap.InfoLevel)
	observedLogger := zap.New(observedZapCore)
	handler := func(ctx context.Context, m queue.MetadataMessage) (bool, error) {
		got = append(got, m)
		return false, nil
	}

	host := os.Getenv("RABBIT_HOST")
	if host == "" {
		host = "localhost"
	}
	port, err := strconv.Atoi(os.Getenv("RABBIT_PORT"))
	if err != nil {
		port = 5672
	}

	config := testConfig{
		queue.Config{
			Protocol: "amqp",
			Host:     host,
			Port:     port,
			Username: "guest",
			Password: "guest",
			Name:     "nft-indexer-test-" + uuid.NewString(),
			Workers:  1,
		},
	}
	// need to call at end as the worker creates the queue when it spawns
	defer config.Tidy(t)

	l, err := queue.NewListener(observedLogger, config.Config, handler)
	if err != nil {
		t.Fatalf("cannot create listener: %v", err)
	}

	eg := errgroup.Group{}
	eg.Go(func() error {
		return l.Run(ctx)
	})

	time.Sleep(200 * time.Millisecond)
	config.Tidy(t)

	time.Sleep(800 * time.Millisecond)
	validMsg := `{
		"pattern": "test-pattern",
		"data": {
			"blockchainName": "chain",
			"blockNumber": 12345,
			"contractAddress": "0x1",
			"contractType": "test",
			"tokenID": "0x2",
			"tokenURI": "http://www.google.com"
		}
	}`
	publish(ctx, t, config, validMsg)

	time.Sleep(200 * time.Millisecond)
	cancel()

	err = eg.Wait()
	if !errors.Is(err, context.Canceled) {
		t.Errorf("unexpected error returned: %s expected: %s", err.Error(), context.Canceled)
	}

	logs := observedLogs.TakeAll()
	if len(logs) != 1 {
		t.Fatalf("got: %d log wanted: 1", len(logs))
	}
	if logs[0].Message != "channel is closed" {
		t.Errorf(`got: %s wanted: "channel is closed"`, logs[0].Message)
	}
}

type testConfig struct {
	queue.Config
}

func (c *testConfig) Tidy(t *testing.T) {
	ch, close := c.Connect(t)
	ch.QueueDelete(c.Name, false, false, false)
	err := close()
	if err != nil {
		t.Errorf("cannot close connection: %v", err)
	}
}

func (c *testConfig) Connect(t *testing.T) (*amqp.Channel, func() error) {
	connURL := c.URL()
	conn, err := amqp.Dial(connURL)
	if err != nil {
		t.Fatalf("cannot connect to amqp: %v", err)
	}
	ch, err := conn.Channel()
	if err != nil {
		t.Fatalf("cannot open channel: %v", err)
	}
	return ch, conn.Close
}

func publish(ctx context.Context, t *testing.T, config testConfig, m string) {
	ch, close := config.Connect(t)
	defer close()

	if err := ch.PublishWithContext(ctx,
		"",          // publish to an exchange
		config.Name, // routing to 0 or more queues
		false,       // mandatory
		false,       // immediate
		amqp.Publishing{
			Headers:         amqp.Table{},
			ContentType:     "application/json",
			ContentEncoding: "",
			Body:            []byte(m),
			DeliveryMode:    amqp.Transient, // 1=non-persistent, 2=persistent
			Priority:        0,              // 0-9
		},
	); err != nil {
		t.Fatalf("cannot publish: %v", err)
	}
}

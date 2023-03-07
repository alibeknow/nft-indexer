package opensearch

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	opensearch "github.com/opensearch-project/opensearch-go"
	opensearchapi "github.com/opensearch-project/opensearch-go/opensearchapi"
	"go.uber.org/zap"
)

type OpenSearch struct {
	log      *zap.Logger
	client   opensearch.Client
	shards   int
	replicas int
}

func New(log *zap.Logger, config Config) (*OpenSearch, error) {
	client, err := opensearch.NewClient(opensearch.Config{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
		Addresses: []string{config.Uri},
	})
	if err != nil {
		return nil, err
	}

	return &OpenSearch{
		client:   *client,
		log:      log,
		shards:   config.Shards,
		replicas: config.Replicas,
	}, nil
}

func (opensearch *OpenSearch) mapMappingsToSettings(mappings map[string]interface{}) (io.Reader, error) {
	var settings struct {
		Settings struct {
			Index struct {
				NumberOfShards   int `json:"number_of_shards"`
				NumberOfReplicas int `json:"number_of_replicas"`
			} `json:"index"`
		} `json:"settings"`
		Mappings map[string]interface{} `json:"mappings"`
	}

	settings.Settings.Index.NumberOfShards = opensearch.shards
	settings.Settings.Index.NumberOfReplicas = opensearch.replicas
	settings.Mappings = mappings

	result, err := json.Marshal(settings)
	if err != nil {
		return nil, err
	}

	return strings.NewReader(string(result)), err
}

func (opensearch *OpenSearch) InitIndex(ctx context.Context, indexName string, mappings map[string]interface{}) error {
	exists, err := opensearch.IndexExists(ctx, indexName)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	opensearch.log.Info("Opensearch index does not exist: creating", zap.String("index", indexName))
	err = opensearch.CreateIndex(ctx, indexName, mappings)
	if err != nil {
		return err
	}

	opensearch.log.Info("Opensearch index created", zap.String("index", indexName))

	return nil
}

func (opensearch *OpenSearch) CreateIndex(ctx context.Context, indexName string, mappings map[string]interface{}) error {
	settings, err := opensearch.mapMappingsToSettings(mappings)
	if err != nil {
		return err
	}

	req := opensearchapi.IndicesCreateRequest{
		Index: indexName,
		Body:  settings,
	}

	resp, err := req.Do(ctx, &opensearch.client)
	if err != nil {
		return err
	}
	if resp.IsError() {
		return errors.New(resp.String())
	}

	return nil
}

func (opensearch *OpenSearch) IndexExists(ctx context.Context, indexName string) (bool, error) {
	existsReq := opensearchapi.IndicesExistsRequest{
		Index: []string{indexName},
	}

	resp, err := existsReq.Do(ctx, &opensearch.client)
	if err != nil {
		return false, err
	}

	return !resp.IsError(), nil
}

func (opensearch *OpenSearch) UpsertToIndex(ctx context.Context, indexName string, docId string, body io.Reader) (*opensearchapi.Response, error) {
	request := opensearchapi.IndexRequest{
		Index:      indexName,
		DocumentID: docId,
		Body:       body,
	}

	resp, err := request.Do(ctx, &opensearch.client)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return resp, errors.New(resp.String())
	}

	return resp, nil
}

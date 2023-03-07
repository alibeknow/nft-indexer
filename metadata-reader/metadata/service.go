package metadata

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"

	"metadata-reader/private/httpreader"
	"metadata-reader/private/opensearch"
	"metadata-reader/queue"
)

var (
	metadataCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "metadata_counter",
			Help: "Number of received metadata",
		},
	)
	errCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "err_counter",
			Help: "Received errors count",
		},
	)
	tooManyReqCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "too_many_request_counter",
			Help: "Number of rate limit requests",
		},
	)
	failedReqCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "failed_request_counter",
			Help: "Number of failed requests",
		},
	)
	requestCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "request_counter",
			Help: "Number of requests",
		},
	)
	storeMetadataDurationGauge = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "store_metadata_gauge",
			Help: "Store metadata duration",
		},
	)
)

func init() {
	prometheus.MustRegister(metadataCounter)
	prometheus.MustRegister(errCounter)
	prometheus.MustRegister(tooManyReqCounter)
	prometheus.MustRegister(failedReqCounter)
	prometheus.MustRegister(requestCounter)
	prometheus.MustRegister(storeMetadataDurationGauge)
}

type Config struct {
	Proxy   string
	Gateway string
	Retries int
	Timeout int
	Index   string
}

type Service struct {
	log        *zap.Logger
	db         DB
	httpReader *httpreader.HttpReader
	gateway    string
	opensearch *opensearch.OpenSearch
	indexName  string
}

func NewService(log *zap.Logger, config Config, db DB, search *opensearch.OpenSearch) (*Service, error) {
	var proxy *url.URL
	var err error

	if config.Proxy != "" {
		proxy, err = url.Parse(config.Proxy)
		if err != nil {
			return nil, err
		}
	}

	httpReader := httpreader.NewHttpReader(proxy, config.Retries, time.Duration(config.Timeout)*time.Second)

	return &Service{
		log:        log,
		db:         db,
		httpReader: httpReader,
		gateway:    config.Gateway,
		opensearch: search,
		indexName:  config.Index,
	}, nil
}

func (s *Service) Read(ctx context.Context, msg queue.MetadataMessage) (bool, error) {
	protocol := strings.SplitN(msg.TokenURI, ":", 2)[0]
	tokenRef := fmt.Sprintf("%s:%s:%s", msg.Blockchain, msg.ContractAddress, msg.TokenID)

	if protocol == "data" {
		tokenData := strings.SplitN(msg.TokenURI, ",", 2)
		if len(tokenData) < 2 {
			s.log.Debug("Inappropriate on-chain metadata format", zap.String("token", tokenRef))
			return false, nil
		}

		headWithoutDataPrefix := strings.Replace(tokenData[0], "data:", "", 1)

		dataTypeAndEncoding := strings.SplitN(headWithoutDataPrefix, ";", 2)
		if len(dataTypeAndEncoding) < 2 {
			s.log.Debug("Inappropriate on-chain metadata format", zap.String("token", tokenRef))
			return false, nil
		}

		if dataTypeAndEncoding[1] != "base64" {
			s.log.Debug("Inappropriate on-chain metadata encoding", zap.String("token", tokenRef))
			return false, nil
		}

		data, err := base64.StdEncoding.DecodeString(tokenData[1])
		if err != nil {
			s.log.Debug("Error decoding metadata", zap.String("token", tokenRef), zap.Error(err))
			return false, err
		}
		metadataCounter.Inc()
		startStoreToDB := time.Now()
		err = s.db.InsertOrUpdate(ctx, Metadata{
			ID:       tokenRef,
			Metadata: string(data),
			Type:     protocol,
		})
		storeMetadataDuration := time.Since(startStoreToDB).Microseconds()
		storeMetadataDurationGauge.Set(float64(storeMetadataDuration))
		if err != nil {
			s.log.Error("Error writing metadata to DB", zap.String("token", tokenRef), zap.Error(err))
			return false, err
		}

		if s.opensearch == nil {
			return false, nil
		}

		metadataDocument, err := MapToMetadataDocument(msg.ContractAddress, Chain(msg.Blockchain), string(data))
		if err != nil {
			s.log.Error("Error mapping metadata to opensearch document", zap.String("token", tokenRef), zap.Error(err))
			return false, err
		}

		b, err := json.Marshal(metadataDocument)
		if err != nil {
			s.log.Error("Error marshaling opensearch metadata document", zap.String("token", tokenRef), zap.Error(err))
			return false, err
		}

		_, err = s.opensearch.UpsertToIndex(ctx, s.indexName, tokenRef, strings.NewReader(string(b)))
		if err != nil {
			s.log.Error("Error writing metadata to opensearch index", zap.String("token", tokenRef), zap.Error(err))
			return false, err
		}

		s.log.Debug("Token is added to index", zap.String("token", tokenRef))

		return false, nil
	}

	uri := msg.TokenURI

	switch protocol {
	case "ipfs":
		trimmed := strings.TrimPrefix(uri, "ipfs://")
		trimmed = strings.TrimPrefix(trimmed, "ipfs/")
		uri = s.gateway + trimmed
	case "https":
		if strings.HasPrefix(msg.TokenURI, "https://ipfs.io/ipfs/") {
			trimmed := strings.TrimPrefix(msg.TokenURI, "https://ipfs.io/ipfs/")
			uri = s.gateway + trimmed
			break
		}
		if strings.HasPrefix(msg.TokenURI, "https://gateway.pinata.cloud/ipfs/") {
			trimmed := strings.TrimPrefix(msg.TokenURI, "https://gateway.pinata.cloud/ipfs/")
			uri = s.gateway + trimmed
			break
		}
		if strings.HasPrefix(msg.TokenURI, "https://api.opensea.io/api/") {
			replacer := strings.NewReplacer("{id}", strings.Replace(msg.TokenID, "0x", "", -1))
			uri = fmt.Sprintf(replacer.Replace(msg.TokenURI))
		}
	}

	resp, body, err := s.httpReader.Read(ctx, uri)
	requestCounter.Inc()
	if err != nil {
		s.log.Debug("HttpReader error", zap.String("token", tokenRef), zap.String("uri", uri), zap.String("originalUri", msg.TokenURI), zap.Error(err))
		errCounter.Inc()
		return false, err
	}

	if resp.StatusCode != http.StatusOK {
		s.log.Debug("Request failed with status code", zap.Int("statusCode", resp.StatusCode), zap.String("token", tokenRef), zap.String("uri", uri), zap.String("originalUri", msg.TokenURI))
		failedReqCounter.Inc()
		if resp.StatusCode == http.StatusTooManyRequests {
			tooManyReqCounter.Inc()
			return true, nil
		}
		return false, nil
	}

	metadataCounter.Inc()
	startStoreToDB := time.Now()
	err = s.db.InsertOrUpdate(ctx, Metadata{
		ID:       tokenRef,
		Metadata: string(body),
		Type:     protocol,
	})
	storeMetadataDuration := time.Since(startStoreToDB).Microseconds()
	storeMetadataDurationGauge.Set(float64(storeMetadataDuration))
	if err != nil {
		s.log.Error("Error writing metadata to DB", zap.String("token", tokenRef), zap.Error(err))
		return false, err
	}

	if s.opensearch == nil {
		return false, nil
	}

	metadataDocument, err := MapToMetadataDocument(msg.ContractAddress, Chain(msg.Blockchain), string(body))
	if err != nil {
		s.log.Error("Error mapping metadata to opensearch document", zap.String("token", tokenRef), zap.Error(err))
		return false, err
	}

	b, err := json.Marshal(metadataDocument)
	if err != nil {
		s.log.Error("Error marshaling opensearch metadata document", zap.String("token", tokenRef), zap.Error(err))
		return false, err
	}

	_, err = s.opensearch.UpsertToIndex(ctx, s.indexName, tokenRef, strings.NewReader(string(b)))
	if err != nil {
		s.log.Error("Error writing metadata to opensearch index", zap.String("token", tokenRef), zap.Error(err))
		return false, err
	}

	s.log.Debug("Token is added to index", zap.String("token", tokenRef))

	return false, nil
}

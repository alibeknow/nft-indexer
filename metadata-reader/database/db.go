package database

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"go.mongodb.org/mongo-driver/mongo/writeconcern"
	"go.uber.org/zap"
)

type Config struct {
	Name             string
	Protocol         string
	Username         string
	Password         string
	Host             string
	Port             int
	SSLEnable        bool
	DirectConnection bool
}

func (config *Config) URL() string {
	url := fmt.Sprintf(
		"%s://%s:%s@%s:%d",
		config.Protocol,
		config.Username,
		config.Password,
		config.Host,
		config.Port,
	)

	if config.DirectConnection {
		url = fmt.Sprintf(
			"%s/?connect=direct",
			url,
		)
	}
	return url
}

type DB struct {
	log    *zap.Logger
	client *mongo.Client
	name   string
}

func Open(log *zap.Logger, ctx context.Context, config Config) (*DB, error) {
	opts := options.Client().ApplyURI(config.URL())

	if config.SSLEnable {
		path, _ := os.Getwd()
		pemPath := fmt.Sprintf("%s/../rds-combined-ca-bundle.pem", path)
		rootPEM, err := os.ReadFile(pemPath)
		if err != nil {
			return nil, err
		}

		roots := x509.NewCertPool()
		if ok := roots.AppendCertsFromPEM(rootPEM); !ok {
			return nil, fmt.Errorf("get certs from %s fail!\n", pemPath)
		}
		tlsConfig := &tls.Config{
			RootCAs:            roots,
			InsecureSkipVerify: true,
		}

		opts.SetReadPreference(readpref.Secondary())
		opts.SetWriteConcern(writeconcern.New(writeconcern.WMajority(), writeconcern.J(true), writeconcern.WTimeout(1000)))
		opts.SetTLSConfig(tlsConfig)
	}

	client, err := mongo.NewClient(opts)
	if err != nil {
		return nil, err
	}

	err = client.Connect(ctx)
	if err != nil {
		return nil, err
	}

	pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()
	err = client.Ping(pingCtx, nil)
	if err != nil {
		return nil, err
	}
	log.Info("Connected to DB", zap.String("url", config.URL()))

	return &DB{
		log:    log,
		client: client,
		name:   config.Name,
	}, nil
}

func (db *DB) Close() error {
	return db.client.Disconnect(context.Background())
}

func (db *DB) Metadata() *MetadataDB {
	coll := db.client.Database(db.name).Collection("metadata")
	return &MetadataDB{
		collection: coll,
	}
}

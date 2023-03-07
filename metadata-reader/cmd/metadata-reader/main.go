package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"github.com/zeebo/errs"
	"go.uber.org/zap"

	metadata_reader "metadata-reader"
	"metadata-reader/config"
	"metadata-reader/database"
	"metadata-reader/metadata"
	"metadata-reader/private/logutils"
	"metadata-reader/private/opensearch"
	"metadata-reader/queue"
	"metadata-reader/server"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		<-c
		cancel()
	}()

	conf, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalln("Couldn't initialize config", err)
	}

	logger, err := logutils.NewLogger(conf.Logger)
	if err != nil {
		log.Fatalln("Couldn't initialize logger", err)
	}

	db, err := database.Open(logger, ctx, conf.Database)
	if err != nil {
		logger.Fatal("Couldn't connect to DB", zap.Error(err))
	}

	srv := server.New(conf.Server, logger)

	opensearch, err := opensearch.New(logger, conf.Search)
	if err != nil {
		logger.Warn("Couldn't initialize opensearch", zap.Error(err))
	}
	if opensearch != nil {
		err := opensearch.InitIndex(ctx, conf.Metadata.Index, metadata.GetMappings())
		if err != nil {
			logger.Fatal("Couldn't initialize opensearch index", zap.String("index", conf.Metadata.Index), zap.Error(err))
		}
	}

	ms, err := metadata.NewService(logger, conf.Metadata, db.Metadata(), opensearch)
	if err != nil {
		logger.Fatal("Couldn't initialize service instance", zap.Error(err))
	}

	listener, err := queue.NewListener(logger, conf.Queue, func(ctx context.Context, message queue.MetadataMessage) (bool, error) {
		return ms.Read(ctx, message)
	})
	if err != nil {
		logger.Fatal("Failed to initialize queue listener", zap.Error(err))
	}

	mr, err := metadata_reader.NewApp(logger, db, srv, listener)
	if err != nil {
		logger.Fatal("Failed to initialize the app", zap.Error(err))
	}

	runError := mr.Run(ctx)
	closeError := mr.Close()
	if err := errs.Combine(runError, closeError); err != nil {
		logger.Fatal("App error", zap.Error(err))
	}
}

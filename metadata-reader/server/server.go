package server

import (
	"context"
	"errors"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type Config struct {
	Address string
}

type Server struct {
	log    *zap.Logger
	server *http.Server
	config Config
}

func (srv *Server) Run(ctx context.Context) (err error) {
	ctx, cancel := context.WithCancel(ctx)
	var group errgroup.Group

	group.Go(func() error {
		<-ctx.Done()
		return srv.server.Shutdown(context.Background())
	})
	group.Go(func() error {
		defer cancel()
		srv.log.Info("server is launched", zap.String("address", srv.config.Address))
		err = srv.server.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) || errors.Is(err, context.Canceled) {
			err = nil
		}
		return err
	})

	return group.Wait()
}

func (srv *Server) Close() error {
	return srv.server.Close()
}

func New(config Config, log *zap.Logger) *Server {
	m := mux.NewRouter()
	m.Path("/metrics").Handler(promhttp.Handler())

	endpoint := NewEndpoint(log)
	m.HandleFunc("/_health", endpoint.HealthCheck).Methods(http.MethodGet)

	srv := http.Server{
		Addr:    config.Address,
		Handler: m,
	}

	return &Server{
		log:    log,
		server: &srv,
		config: config,
	}
}

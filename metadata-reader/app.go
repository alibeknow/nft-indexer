package metadata_reader

import (
	"context"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/zeebo/errs"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"metadata-reader/database"
	"metadata-reader/private/httpreader"
	"metadata-reader/queue"
	"metadata-reader/server"
)

var (
	requestPerSecond = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "request_per_second_gauge",
			Help: "Number of requests per second",
		},
	)
	messagePerSecond = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "message_per_second_gauge",
			Help: "Number of messages per second",
		},
	)
	instantRequestPerSecond = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "instant_request_per_second_gauge",
			Help: "Instant number of reqs per second",
		},
	)

	instantMessagePerSecond = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "instant_messages_per_second_gauge",
			Help: "Instant number of reqs per second",
		},
	)
)

func init() {
	prometheus.MustRegister(requestPerSecond)
	prometheus.MustRegister(messagePerSecond)
	prometheus.MustRegister(instantRequestPerSecond)
	prometheus.MustRegister(instantMessagePerSecond)
}

type App struct {
	log      *zap.Logger
	db       *database.DB
	srv      *server.Server
	listener *queue.Listener
}

func NewApp(log *zap.Logger, db *database.DB, srv *server.Server, listener *queue.Listener) (*App, error) {
	app := &App{
		log:      log,
		db:       db,
		srv:      srv,
		listener: listener,
	}

	return app, nil
}

func (mr *App) Run(ctx context.Context) error {
	group, ctx := errgroup.WithContext(ctx)

	group.Go(func() error {
		now := time.Now()
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()

		var (
			reqLast int64
			msgLast int64
		)

		for {
			select {
			case <-ctx.Done():
				return nil
			case <-ticker.C:
				duration := time.Since(now).Seconds()

				reqCount := httpreader.TotalRequestCount()
				requestPerSecond.Set(float64(reqCount) / duration)
				reqDelta := reqCount - reqLast
				reqLast = reqCount
				instantRequestPerSecond.Set(float64(reqDelta))

				msgCount := queue.TotalMessageCount()
				messagePerSecond.Set(float64(msgCount) / duration)
				msgDelta := msgCount - msgLast
				msgLast = msgCount
				instantMessagePerSecond.Set(float64(msgDelta))
			}
		}
	})
	group.Go(func() error {
		return mr.srv.Run(ctx)
	})
	group.Go(func() error {
		return mr.listener.Run(ctx)
	})

	return group.Wait()
}

func (mr *App) Close() error {
	serverErr := mr.srv.Close()
	listenerErr := mr.listener.Close()

	return errs.Combine(serverErr, listenerErr)
}

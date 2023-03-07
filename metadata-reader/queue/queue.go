package queue

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"metadata-reader/private/average"
)

var (
	msgCount           int64
	avgHandlerDuration average.Incremental

	msgCounter = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "msg_counter",
			Help: "Received messages count",
		},
	)
	taskGauge = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "task_gauge",
			Help: "Current count of tasks",
		},
	)
	consumeDurationGauge = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "consume_duration_gauge",
			Help: "Consume duration",
		},
	)
)

var errClosed = errors.New("channel closed")

func init() {
	prometheus.MustRegister(msgCounter)
	prometheus.MustRegister(taskGauge)
	prometheus.MustRegister(consumeDurationGauge)
}

func TotalMessageCount() int64 {
	return atomic.LoadInt64(&msgCount)
}

type MetadataMessage struct {
	Blockchain      string `json:"blockchainName"`
	BlockNumber     int64  `json:"blockNumber"`
	ContractAddress string `json:"contractAddress"`
	ContractType    string `json:"contractType"`
	TokenID         string `json:"tokenID"`
	TokenURI        string `json:"tokenURI"`
}
type Data struct {
	Pattern string          `json:"pattern"`
	Data    MetadataMessage `json:"data"`
}

type Handler func(context.Context, MetadataMessage) (bool, error)

type Listener struct {
	log       *zap.Logger
	conn      *amqp.Connection
	workers   int
	queueName string
	handler   Handler
}

func NewListener(log *zap.Logger, config Config, handler Handler) (*Listener, error) {
	connURL := config.URL()
	conn, err := amqp.Dial(connURL)
	if err != nil {
		return nil, err
	}
	return &Listener{
		log:       log,
		conn:      conn,
		workers:   config.Workers,
		queueName: config.Name,
		handler:   handler,
	}, nil
}

func (listener *Listener) Run(ctx context.Context) error {
	group, ctx := errgroup.WithContext(ctx)

	for i := 0; i < listener.workers; i++ {
		group.Go(func() error {
			for {
				select {
				case <-ctx.Done():
					return ctx.Err()
				default:
				}
				err := listener.worker(ctx)
				if err == errClosed {
					time.Sleep(500 * time.Millisecond)
					continue
				}
				return err
			}
		})
	}

	return group.Wait()
}

func (listener *Listener) Close() error {
	return listener.conn.Close()
}

func (listener *Listener) worker(ctx context.Context) error {
	ch, err := listener.conn.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	err = ch.Qos(1, 0, false)
	if err != nil {
		return err
	}

	_, err = ch.QueueDeclare(
		listener.queueName,
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(
		listener.queueName,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg, ok := <-msgs:
			if !ok {
				listener.log.Error("channel is closed")
				return errClosed
			}
			atomic.AddInt64(&msgCount, 1)
			msgCounter.Inc()
			taskGauge.Inc()
			var data Data
			if err := json.NewDecoder(bytes.NewBuffer(msg.Body)).Decode(&data); err != nil {
				listener.log.Error("Decoding event has been failed", zap.String("msg", string(msg.Body)))
				taskGauge.Dec()
				continue
			}

			consumeStart := time.Now()
			_, err := listener.handler(ctx, data.Data)
			consumeDuration := time.Since(consumeStart)

			avgHandlerDuration.Increment(int64(consumeDuration))
			consumeDurationGauge.Set(float64(avgHandlerDuration.Value()))

			tokenRef := fmt.Sprintf("%s:%s:%s", data.Data.Blockchain, data.Data.ContractAddress, data.Data.TokenID)
			if err != nil {
				listener.log.Error("Queue handler error", zap.String("token", tokenRef), zap.Error(err))
			}

			err = msg.Ack(false)
			if err != nil {
				listener.log.Error("Ack error", zap.String("token", tokenRef), zap.Error(err))
			}

			taskGauge.Dec()
		}
	}
}

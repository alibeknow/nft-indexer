package httpreader

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/url"
	"sync/atomic"
	"time"

	"github.com/prometheus/client_golang/prometheus"

	"metadata-reader/private/average"
)

var (
	countRequest         int64
	totalRequestDuration time.Duration
	avgRequestDuration   average.Incremental
)

var (
	requestDurationGauge = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "request_duration_gauge",
			Help: "Request duration",
		},
	)
)

func init() {
	prometheus.MustRegister(requestDurationGauge)
}

func TotalRequestCount() int64 {
	return atomic.LoadInt64(&countRequest)
}

type HttpReader struct {
	client  *http.Client
	retries int
	timeout time.Duration
}

func NewHttpReader(proxy *url.URL, retries int, timeout time.Duration) *HttpReader {
	tr := &http.Transport{
		Proxy: nil,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	if proxy != nil {
		tr.Proxy = http.ProxyURL(proxy)
	}

	return &HttpReader{
		client:  &http.Client{Transport: tr},
		retries: retries,
		timeout: timeout,
	}
}

func (hr *HttpReader) Read(ctx context.Context, uri string) (*http.Response, string, error) {
	reqCtx, reqCancel := context.WithTimeout(ctx, hr.timeout)
	defer reqCancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, uri, nil)
	if err != nil {
		return nil, "", err
	}

	httpResponse, body, err := hr.doWithRetries(req, hr.retries)
	if err != nil {
		return nil, "", err
	}

	return httpResponse, string(body), nil
}

func (hr *HttpReader) do(req *http.Request) (*http.Response, []byte, error) {
	resp, err := hr.client.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}

	return resp, body, nil
}

func (hr *HttpReader) doWithRetries(req *http.Request, retries int) (*http.Response, []byte, error) {
	var body []byte
	var err error
	var resp *http.Response

	for i := 1; i <= retries+1; i++ {
		requestStartTime := time.Now()
		resp, body, err = hr.do(req)
		requestDuration := time.Since(requestStartTime)

		atomic.AddInt64(&countRequest, 1)
		atomic.AddInt64((*int64)(&totalRequestDuration), int64(requestDuration))

		avgRequestDuration.Increment(int64(requestDuration))
		requestDurationGauge.Set(float64(avgRequestDuration.Value()))

		if err != nil {
			return nil, nil, err
		}

		if resp.StatusCode != http.StatusTooManyRequests {
			return resp, body, nil
		}

		if i != retries+1 {
			backoff := time.Duration(i*200) * time.Millisecond
			time.Sleep(backoff)
		}
	}

	return resp, body, nil
}

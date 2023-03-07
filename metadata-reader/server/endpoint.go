package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"go.uber.org/zap"
)

type Endpoint struct {
	log *zap.Logger
}

func NewEndpoint(log *zap.Logger) *Endpoint {
	return &Endpoint{
		log: log,
	}
}

func (endpoint *Endpoint) HealthCheck(w http.ResponseWriter, _ *http.Request) {
	endpoint.log.Debug("New health check request")

	w.WriteHeader(http.StatusOK)

	_, err := fmt.Fprintf(w, "Metadata Reader is up and running")
	if err != nil {
		endpoint.serveJSONError(w, http.StatusInternalServerError, err)
		return
	}
}

func (endpoint *Endpoint) serveJSONError(w http.ResponseWriter, status int, err error) {
	w.WriteHeader(status)

	var data struct {
		Error string `json:"error"`
	}
	data.Error = err.Error()

	if err = json.NewEncoder(w).Encode(data); err != nil {
		endpoint.log.Error("Error encoding output to json", zap.Error(err))
	}
}

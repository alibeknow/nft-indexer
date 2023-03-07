# BUILDER Image
FROM golang:1.17.4-alpine3.15 as builder
WORKDIR /app
COPY ./metadata-reader .
COPY ./cert .
RUN go mod download && go mod tidy

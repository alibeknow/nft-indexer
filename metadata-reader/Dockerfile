# BUILDER Image
FROM golang:1.17.4-alpine3.15 as builder

WORKDIR /app

COPY ./metadata-reader .
COPY ./cert .

RUN go mod download && go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o metadata-reader ./cmd/metadata-reader/main.go

# Result image
FROM alpine:3.15.4

COPY --from=builder /app/metadata-reader .
COPY --from=builder /app/rds-combined-ca-bundle.pem .

ENTRYPOINT ["/metadata-reader", "run"]

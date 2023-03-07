package metadata

import (
	"context"
	"time"
)

type Metadata struct {
	ID        string     `bson:"_id"`
	Metadata  string     `bson:"metadata"`
	Type      string     `bson:"type"`
	CreatedAt *time.Time `bson:"created_at,omitempty"`
	UpdatedAt *time.Time `bson:"updated_at,omitempty"`
}

type DB interface {
	InsertOrUpdate(ctx context.Context, m Metadata) error
}

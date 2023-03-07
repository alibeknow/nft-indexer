package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"metadata-reader/metadata"
)

type MetadataDB struct {
	collection *mongo.Collection
}

func (mDB MetadataDB) InsertOrUpdate(ctx context.Context, m metadata.Metadata) error {
	currentTime := time.Now()

	filter := bson.M{"_id": m.ID}
	update := bson.M{
		"$set": bson.M{
			"metadata":   m.Metadata,
			"type":       m.Type,
			"updated_at": currentTime,
		},
		"$setOnInsert": bson.M{
			"created_at": currentTime,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := mDB.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

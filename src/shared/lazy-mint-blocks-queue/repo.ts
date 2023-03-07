import { Inject, Injectable } from '@nestjs/common';
import { Collection, InsertOneResult, UpdateResult, WithId } from 'mongodb';
// TODO Replace deprecated DB provider to DBProvider
import { DB, MongoSort } from '../db';

export type LazyMintBlockQueue = {
  from: number;
  to: number;
  createdAt: Date;
  isDeleted?: boolean;
};

interface IDB {
  lazyMintBlocksQueue(): Collection<LazyMintBlockQueue>;
}

export type RangeQueueAttributes = {
  from: number;
  to: number;
  createdAt?: Date;
  isDeleted?: boolean;
};

@Injectable()
export class LazyMintBlocksQueueRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  public async softDelete(from: number, to: number): Promise<UpdateResult> {
    return this.db.lazyMintBlocksQueue().updateOne({ from, to }, { $set: { isDeleted: true } });
  }

  public async save(rangeQueueAttributes: RangeQueueAttributes): Promise<InsertOneResult> {
    const { from, to, createdAt } = rangeQueueAttributes;

    return this.db.lazyMintBlocksQueue().insertOne({
      from,
      to,
      isDeleted: false,
      createdAt: createdAt ? createdAt : new Date(),
    });
  }

  public async getCreatedAfter(createdAt: Date, limit: number): Promise<WithId<LazyMintBlockQueue>[]> {
    const cursor = await this.db.lazyMintBlocksQueue()
      .find({
        createdAt: {
          $gt: createdAt,
        },
        isDeleted: false,
      })
      .limit(limit)
      .sort({ createdAt: MongoSort.ASC });

    return cursor.toArray();
  }

  public async getLatest(to: number): Promise<WithId<LazyMintBlockQueue> | null> {
    return this.db.lazyMintBlocksQueue()
      .findOne({
        isDeleted: false,
        to: {
          $lt: to,
        },
      }, {
        sort: { to: MongoSort.DESC },
      });
  }
}

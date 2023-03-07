import { Inject, Injectable } from '@nestjs/common';
import { Collection, InsertOneResult, UpdateResult, WithId } from 'mongodb';
// TODO Replace deprecated DB provider to DBProvider
import { DB } from '@shared/db';
import { MongoSort } from '../db';

export type BlockQueue = {
  from: number;
  to: number;
  toHash?: string;
  createdAt: Date;
  isDeleted?: boolean;
};

interface IDB {
  blocksQueue(): Collection<BlockQueue>;
}

export type RangeQueueAttributes = {
  from: number;
  to: number;
  toHash?: string;
  createdAt?: Date;
  isDeleted?: boolean;
};

@Injectable()
export class BlocksQueueRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  public async softDelete(from: number, to: number): Promise<UpdateResult> {
    return this.db.blocksQueue().updateOne({ from, to }, { $set: { isDeleted: true } });
  }

  public async save(rangeQueueAttributes: RangeQueueAttributes): Promise<InsertOneResult> {
    const { from, to, createdAt, toHash } = rangeQueueAttributes;

    return this.db.blocksQueue().insertOne({
      from,
      to,
      toHash,
      isDeleted: false,
      createdAt: createdAt ? createdAt : new Date(),
    });
  }

  public async getCreatedAfter(createdAt: Date, limit: number): Promise<WithId<BlockQueue>[]> {
    const cursor = await this.db.blocksQueue()
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

  public async getLatest(to: number): Promise<WithId<BlockQueue> | null> {
    return this.db.blocksQueue()
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

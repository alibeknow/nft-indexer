import { Inject, Injectable } from '@nestjs/common';
import { BulkWriteResult, Collection, DeleteResult, WithId } from 'mongodb';
// TODO Replace deprecated DB provider to DBProvider
import { DB, MongoSort } from '@shared/db';
import { TokenStandard } from '../tokens';

export type Event = {
  _id: string;
  blockNumber: number;
  contractAddress: string;
  logIndex: number;
  type: TokenStandard;
  from: string;
  to: string;
  ids: string[];
  values: number[];
  createdAt: Date;
};

interface IDB {
  events(): Collection<Event>;
  eventsIndexes(): Promise<string>;
}

export type EventAttributes = {
  blockNumber: number;
  contractAddress: string;
  transactionHash: string;
  logIndex: number;
  type: TokenStandard;
  from: string;
  to: string;
  ids: string[];
  values: number[];
  createdAt?: Date;
};

/**
 * Events Repository (Injectable Class)
 */
@Injectable()
export class EventsRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  /**
   * Recieve event list by array of identifiers
   *
   * @param {string[]} ids array of token identifiers
   * @returns {Promise<Event[]>} array of events
   */
  public async getWhereIdIn(ids: string[]): Promise<WithId<Event>[]> {
    const cursor = this.db.events().find<Event>({
      _id: { '$in': ids },
    });

    return cursor.toArray();
  }

  /**
   * Asynchronously get events count by block range from DB
   *
   * @example <caption>Get events count for block range 14 - 18</caption>
   * await eventsRepo.countByBlockRange(14, 18);
   *
   * @param {number} blockNumberFrom first block of range
   * @param {number} blockNumberTo last block of range
   * @returns {Promise<number>}
   */
  public async countByBlockRange(blockNumberFrom: number, blockNumberTo: number): Promise<number> {
    return this.db.events()
      .countDocuments({ blockNumber: { $gte: blockNumberFrom, $lte: blockNumberTo } });
  }

  /**
   * Asynchronously delete events by block range from DB
   *
   * @example <caption>Delete events of blocks from 14 to 18</caption>
   * await eventsRepo.deleteByBlockRange(14, 18);
   *
   * @param {number} blockNumberFrom first block of range
   * @param {number} blockNumberTo last block of range
   * @returns {Promise<DeleteResult>}
   */
  public async deleteByBlockRange(blockNumberFrom: number, blockNumberTo: number): Promise<DeleteResult> {
    return this.db.events()
      .deleteMany({ blockNumber: { $gte: blockNumberFrom, $lte: blockNumberTo } });
  }

  /**
   * Asynchronously delete events where block number greater than a provided block
   *
   * @example <caption>Delete events where block number greater that</caption>
   * await eventsRepo.deleteWhereBlockNumberGreaterThan(18);
   *
   * @param {number} blockNumber
   * @returns {Promise<DeleteResult>}
   */
  public async deleteWhereBlockNumberGreaterThan(blockNumber: number): Promise<DeleteResult> {
    return this.db.events()
      .deleteMany({ blockNumber: { $gt: blockNumber } });
  }

  /**
   * Asynchronously get events by block range from DB
   *
   * @example <caption>Get events of blocks from 14 to 18</caption>
   * await eventsRepo.getByBlockRange(14, 18);
   *
   * @param {number} blockNumberFrom first block of range
   * @param {number} blockNumberTo last block of range
   * @returns {Promise<WithId<Event>[]>} events
   */
  public async getByBlockRange(blockNumberFrom: number, blockNumberTo: number): Promise<WithId<Event>[]> {
    const cursor = this.db.events()
      .find({ blockNumber: { $gte: blockNumberFrom, $lte: blockNumberTo } })
      .sort({ blockNumber: MongoSort.ASC, logIndex: MongoSort.ASC });

    return cursor.toArray();
  }

  /**
   * Asynchronously save array of events into DB
   *
   * @example
   * await eventsRepo.bulkSave(events);
   *
   * @param {EventAttributes[]} events array of events
   * @returns {Promise<BulkWriteResult>} result of bulk save
   */
  public async bulkSave(events: EventAttributes[]): Promise<BulkWriteResult> {
    return this.db.events().bulkWrite(events.map((event) => {
      const { blockNumber, transactionHash, logIndex, contractAddress, type, from, to, ids, values, createdAt } = event;

      return {
        insertOne: {
          document: {
            _id: `${blockNumber}:${transactionHash}:${logIndex}`,
            blockNumber,
            contractAddress,
            logIndex,
            type,
            from,
            to,
            ids,
            values,
            createdAt: createdAt ? createdAt : new Date(),
          },
        },
      };
    }));
  }

  /**
   * Asynchronously upsert array of events into DB
   *
   * @example
   * await eventsRepo.bulkUpsert(events);
   *
   * @param {EventAttributes[]} events array of events
   * @returns {Promise<BulkWriteResult>} result of bulk save
  */
  public async bulkUpsert(events: EventAttributes[]): Promise<BulkWriteResult> {
    return this.db.events().bulkWrite(events.map((event) => {
      const { blockNumber, transactionHash, logIndex, contractAddress, type, from, to, ids, values, createdAt } = event;

      return {
        updateOne: {
          filter: { _id: `${blockNumber}:${transactionHash}:${logIndex}` },
          update: {
            $set: {
              _id: `${blockNumber}:${transactionHash}:${logIndex}`,
              blockNumber,
              contractAddress,
              logIndex,
              type,
              from,
              to,
              ids,
              values,
              createdAt: createdAt ? createdAt : new Date(),
            },
          },
          upsert: true,
        },
      };
    }));
  }

  public async bulkSaveOrUpdate(events: EventAttributes[]): Promise<BulkWriteResult> {
    return this.db.events().bulkWrite(events.map((event) => {
      const { blockNumber, transactionHash, logIndex, contractAddress, type, from, to, ids, values, createdAt } = event;

      return {
        updateOne: {
          filter: { _id: `${blockNumber}:${transactionHash}:${logIndex}` },
          update: {
            $set: {
              type,
            },
            $setOnInsert: {
              blockNumber,
              contractAddress,
              logIndex,
              from,
              to,
              ids,
              values,
              createdAt: createdAt ? createdAt : new Date(),
            },
          },
          upsert: true,
        },
      };
    }));
  }
}

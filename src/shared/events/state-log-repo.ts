import { v4 as uuidv4 } from 'uuid';
import { Inject, Injectable } from '@nestjs/common';
import { Collection, WithId } from 'mongodb';
import { DB, MongoSort } from '@shared/db';

export enum EventIndexType {
  NEW_ONLY = 'NEW_ONLY',
  REINDEX = 'REINDEX',
}

export type EventsReaderStateLog = {
  _id: string;
  blockNumberFrom: number | null;
  blockNumberTo: number | null;
  type: EventIndexType;
  inProgress: boolean;
  startAt: Date;
  endAt: Date | null;
};

interface IDB {
  eventsReaderStateLog(): Collection<EventsReaderStateLog>;
  eventsReaderStateLogIndexes(): Promise<string>;
}

export type EventsReaderStateLogAttributes = {
  id?: string;
  blockNumberFrom?: number | null;
  blockNumberTo?: number | null;
  type?: EventIndexType;
  inProgress?: boolean;
  endAt?: Date;
};

/**
 * Events Reader State Logs (Injectable Class)
 */
@Injectable()
export class EventsReaderStateLogRepo {
  constructor(
    @Inject(DB) private readonly db: IDB,
  ) {}

  public async insertOrUpdate(attributes: EventsReaderStateLogAttributes): Promise<string> {
    const id = attributes.id || uuidv4();

    const setData: EventsReaderStateLogAttributes = {
      inProgress: attributes.inProgress || (attributes.endAt ? false : true),
    };

    if (typeof attributes.blockNumberFrom !== 'undefined') {
      setData.blockNumberFrom = attributes.blockNumberFrom;
    }

    if (typeof attributes.blockNumberTo !== 'undefined') {
      setData.blockNumberTo = attributes.blockNumberTo;
    }

    if (typeof attributes.type !== 'undefined') {
      setData.type = attributes.type;
    }

    if (typeof attributes.endAt !== 'undefined') {
      setData.endAt = attributes.endAt;
    }

    await this.db.eventsReaderStateLog().updateOne({ _id: id }, {
      $set: setData,
      $setOnInsert: {
        startAt: new Date(),
      },
    },
    {
      upsert: true,
    });

    return id;
  }

  public async getById(id: string): Promise<WithId<EventsReaderStateLog> | null> {
    return this.db.eventsReaderStateLog().findOne({ _id: id });
  }

  public async getCurrentLog(): Promise<WithId<EventsReaderStateLog> | null> {
    const cursor = this.db.eventsReaderStateLog().find().sort({ startAt: MongoSort.DESC }).limit(1);
    const stateLogsArray = await cursor.toArray();

    return stateLogsArray[0] || null;
  }
}

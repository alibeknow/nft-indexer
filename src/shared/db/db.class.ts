import { LazyMintBlockQueue } from '../lazy-mint-blocks-queue';
import { Collection, MongoClient } from 'mongodb';
import { BlockQueue } from '../blocks-queue';
import {
  MONGO_BLOCKS_QUEUE_COLLECTION_NAME,
  MONGO_CONTRACTS_COLLECTION_NAME,
  MONGO_EVENTS_COLLECTION_NAME,
  MONGO_EVENTS_READER_STATE_LOG_COLLECTION_NAME,
  MONGO_LAZY_MINT_BLOCKS_QUEUE_COLLECTION_NAME,
  MONGO_METADATA_COLLECTION_NAME,
  MONGO_TOKENS_COLLECTION_NAME,
} from './constants';
import { Token } from '../tokens';
import { Metadata } from '../metadata';
import { Event, EventsReaderStateLog } from '../events';
import { MongoSort } from './mongo-sort';
import { Contract } from '../contracts';
import { IDatabaseConfig, getMongoDBUri } from './db.config';

export class DBClass {
  private client: MongoClient;
  private directConnection: boolean;
  private sslEnable: boolean;
  private uri: string;
  private dbName: string;

  constructor(databaseConfig: IDatabaseConfig) {
    this.directConnection = databaseConfig.directConection;
    this.sslEnable = databaseConfig.enableSsl;
    this.dbName = databaseConfig.db;
    this.uri = getMongoDBUri(databaseConfig);

    let options = {};

    if(this.directConnection) {
      options = {
        ...options,
        directConnection: true,
      };
    }

    if(this.sslEnable) {
      options = {
        ...options,
        ssl: true,
        sslValidate: false,
        sslCA: `${__dirname  }/../../../cert/rds-combined-ca-bundle.pem`,
      };
    }

    this.client = new MongoClient(this.uri, options);
  }

  public async open(): Promise<MongoClient> {
    return this.client.connect();
  }

  public async close(force: boolean): Promise<void> {
    return this.client.close(force);
  }

  public tokens(): Collection<Token> {
    return this.client.db(this.dbName).collection<Token>(MONGO_TOKENS_COLLECTION_NAME);
  }

  public async createTokensIndexes(): Promise<string> {
    return this.tokens().createIndex({ createdAt: MongoSort.ASC });
  }

  public async createBlockQueueIndexes(): Promise<string> {
    return this.blocksQueue().createIndex({ to: MongoSort.DESC });
  }

  public async createLazyMintBlockQueueIndexes(): Promise<string> {
    return this.lazyMintBlocksQueue().createIndex({ to: MongoSort.DESC });
  }

  public metadata(): Collection<Metadata> {
    return this.client.db(this.dbName).collection<Metadata>(MONGO_METADATA_COLLECTION_NAME);
  }

  public events(): Collection<Event> {
    return this.client.db(this.dbName).collection<Event>(MONGO_EVENTS_COLLECTION_NAME);
  }

  public async eventsIndexes(): Promise<string> {
    return this.events().createIndex({ blockNumber: MongoSort.ASC, logIndex: MongoSort.ASC });
  }

  public eventsReaderStateLog(): Collection<EventsReaderStateLog> {
    return this.client.db(this.dbName).collection<EventsReaderStateLog>(MONGO_EVENTS_READER_STATE_LOG_COLLECTION_NAME);
  }

  public async eventsReaderStateLogIndexes(): Promise<string> {
    return this.eventsReaderStateLog().createIndex({ startAt: MongoSort.DESC });
  }

  public blocksQueue(): Collection<BlockQueue> {
    return this.client.db(this.dbName).collection<BlockQueue>(MONGO_BLOCKS_QUEUE_COLLECTION_NAME);
  }

  public lazyMintBlocksQueue(): Collection<LazyMintBlockQueue> {
    return this.client.db(this.dbName).collection<LazyMintBlockQueue>(MONGO_LAZY_MINT_BLOCKS_QUEUE_COLLECTION_NAME);
  }

  public contracts(): Collection<Contract> {
    return this.client.db(this.dbName).collection<Contract>(MONGO_CONTRACTS_COLLECTION_NAME);
  }
}

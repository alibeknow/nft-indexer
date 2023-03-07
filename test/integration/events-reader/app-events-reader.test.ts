import { v4 as uuid } from 'uuid';

process.env.RABBIT_BLOCK_READ_QUEUE = `test-queue-${uuid()}`;

import { setTimeout } from 'timers/promises';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { IEventsReaderConfig, getEventsReaderConfig } from '@app-events-reader/app.config';
import { EventsReaderParams, EventsReaderService } from '@app-events-reader/events-reader';
import { DBClass, IDatabaseConfig } from '@shared/db';
import { BlocksQueueRepo } from '@shared/blocks-queue';
import { EventsRepo } from '@shared/events';
import { clientFactory } from '@shared/microservices';
import { Web3Provider } from '@shared/web3';
import { block14316459Data } from './fixtures/block-14316459-data.fixtures';
import { block14316460Data } from './fixtures/block-14316460-data.fixtures';
import { block14316461Data } from './fixtures/block-14316461-data.fixtures';
import { fixtureProviderLogs } from './fixtures/provider-logs.fixtures';
import { fixtureProviderLogsForReorg } from './fixtures/provider-logs-for-reorg.fixtures';
import { fixtureProviderLogsPre721 } from './fixtures/provider-logs-pre-721.fixtures';

jest.setTimeout(100000);

describe('[app-events-reader]', () => {
  let db: DBClass;
  let client: ClientProxy;

  beforeAll(async () => {
    const configService = new ConfigService<IEventsReaderConfig>(getEventsReaderConfig());
    const dbConfig: IDatabaseConfig = configService.get<IDatabaseConfig>('database') as IDatabaseConfig;
    db = new DBClass({ ...dbConfig, db: `app-events-reader-test-${dbConfig.db}` });

    await db.open();

    await db.events().deleteMany({});
    await db.blocksQueue().deleteMany({});
    client = await clientFactory(configService, 'blocksQueue');
  });

  afterEach(async () => {
    await db.events().deleteMany({});
    await db.blocksQueue().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
    await setTimeout(1000);
    await client.close();
  });

  it('should check the received events from the provider with the events in the database', async () => {
    const eventReaderConfig: IEventsReaderConfig = getEventsReaderConfig();
    eventReaderConfig.service.pre721ContractsEnabled = false;
    const configService = new ConfigService<IEventsReaderConfig>(eventReaderConfig);

    const web3Provider = new Web3Provider<IEventsReaderConfig>(configService);
    jest.spyOn(web3Provider.provider, 'getLogs').mockImplementation(async () => {
      return new Promise((resolve) => resolve(fixtureProviderLogs));
    });

    const erParams: EventsReaderParams = {
      blockNumberFrom: 14316461,
      blockNumberTo: 14316461,
    };

    const er = new EventsReaderService(
      client,
      web3Provider,
      new EventsRepo(db),
      new BlocksQueueRepo(db),
      configService,
    );

    await er.read(erParams, false);

    // removed the createdAt date from the documents, as it will constantly change
    const eventsResult = await db.events().find({}).project({ createdAt: 0 }).toArray();

    expect(eventsResult).toMatchSnapshot();
  });

  it('should check the received PRE-721 events from the provider with the events in the database', async () => {
    const eventReaderConfig: IEventsReaderConfig = getEventsReaderConfig();
    eventReaderConfig.service.pre721ContractsEnabled = true;
    const configService = new ConfigService<IEventsReaderConfig>(eventReaderConfig);

    const web3Provider = new Web3Provider<IEventsReaderConfig>(configService);
    jest.spyOn(web3Provider.provider, 'getLogs').mockImplementation(async () => {
      return new Promise((resolve) => resolve(fixtureProviderLogsPre721));
    });

    const erParams: EventsReaderParams = {
      blockNumberFrom: 6741407,
      blockNumberTo: 6741407,
    };

    const er = new EventsReaderService(
      client,
      web3Provider,
      new EventsRepo(db),
      new BlocksQueueRepo(db),
      configService,
    );

    await er.read(erParams, false);

    // removed the createdAt date from the documents, as it will constantly change
    const eventsResult = await db.events().find({}).project({ createdAt: 0 }).toArray();

    expect(eventsResult).toMatchSnapshot();
  });

  it('should handle blockchain reorg', async () => {
    const eventReaderConfig: IEventsReaderConfig = getEventsReaderConfig();
    eventReaderConfig.service.pre721ContractsEnabled = false;
    const configService = new ConfigService<IEventsReaderConfig>(eventReaderConfig);

    const web3Provider = new Web3Provider<IEventsReaderConfig>(configService);
    jest.spyOn(web3Provider.provider, 'getBlock').mockImplementation(async (blockNumber) => {
      let result: ethers.providers.Block;

      if(blockNumber === 14316459) {
        result = block14316459Data as unknown as ethers.providers.Block;
      } else if(blockNumber === 14316460) {
        result = block14316460Data as unknown as ethers.providers.Block;
      } else {
        result = block14316461Data as unknown as ethers.providers.Block;
      }

      return new Promise((resolve) => resolve(result));
    });

    const erParams: EventsReaderParams = {
      blockNumberFrom: 14316461,
      blockNumberTo: 14316461,
    };

    const eventsRepo = new EventsRepo(db);
    const blocksQueueRepo = new BlocksQueueRepo(db);
    const er = new EventsReaderService(
      client,
      web3Provider,
      eventsRepo,
      blocksQueueRepo,
      configService,
    );

    await blocksQueueRepo.save({
      from: 14316460,
      to: 14316460,
      toHash: 'fake-to-hash',
      createdAt: new Date('2019-12-15T04:55:00'),
    });

    // @ts-ignore
    jest.spyOn(web3Provider.provider, 'getLogs').mockImplementation(async ({ fromBlock, toBlock }) => {
      let results: ethers.providers.Log[];

      if(fromBlock === 14316460 && toBlock === 14316460) {
        results = fixtureProviderLogsForReorg;
      } else {
        results = fixtureProviderLogs;
      }

      return new Promise((resolve) => resolve(results));
    });

    await er.read(erParams, true);

    // removed the createdAt date from the documents, as it will constantly change
    const eventsResult = await db.events().find({}).project({ createdAt: 0 }).toArray();

    expect(eventsResult).toMatchSnapshot();
  });
});

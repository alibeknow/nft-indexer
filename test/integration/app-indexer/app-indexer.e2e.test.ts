import { v4 as uuid } from 'uuid';

process.env.RABBIT_BLOCK_READ_QUEUE = `test-queue-${uuid()}`;

import { ethers } from 'ethers';
import { setTimeout } from 'timers/promises';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IIndexerConfig, IServiceConfig, getIndexerConfig } from '@app-indexer/app.config';
import { TokenProcessorModule } from '@app-indexer/token-processor';
import * as nfts from '@shared/nfts';
import { DB, DBClass, IDatabaseConfig, MongoSort, getDatabaseConfig } from '@shared/db';
import { ServiceEvents, bootstrapMicroservice, clientFactory } from '@shared/microservices';
import { fixtureEvents } from './fixtures';

jest.mock('@shared/nfts', () => {
  const original = jest.requireActual('@shared/nfts');

  return {
    ...original,
    getContractInstance: jest.fn(),
  };
});

jest.spyOn(nfts, 'getContractInstance').mockImplementation((...args) => {
  return {
    address: args[0] as string,
    name: () => new Promise((resolve) => resolve(args[0])),
    tokenURI: (id: string) => new Promise((resolve) => resolve(`https://tokenUri/${id}`)),
    uri: (id: string) => new Promise((resolve) => resolve(`https://uri/${id}`)),
  } as unknown as ethers.Contract;
});

jest.setTimeout(100000);

describe('[app-indexer] (e2e)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `app-indexer-e2e-test-${dbConfig.db}` });
    await db.open();

    await Promise.all([
      db.events().deleteMany({}),
      db.tokens().deleteMany({}),
      db.contracts().deleteMany({}),
    ]);
    await db.events().insertMany(fixtureEvents);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TokenProcessorModule,
        ConfigModule.forRoot({
          load: [ getIndexerConfig ],
          isGlobal: true,
        }),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();

    const configService = moduleRef.get<ConfigService<IIndexerConfig>>(ConfigService<IIndexerConfig>);
    const serviceConfig = configService.get<IServiceConfig>('service') as IServiceConfig;

    await bootstrapMicroservice(app, 'blocksQueue');
    await app.listen(serviceConfig.port);

    client = clientFactory(configService, 'blocksQueue');
    await client.connect();
  });

  afterEach(async () => {
    await Promise.all([
      db.tokens().deleteMany({}),
      db.contracts().deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await db.events().deleteMany({});
    await db.close(true);
    await app.close();
    await setTimeout(1000);
    await client.close();
  });

  it('emit event to the app-indexer', async () => {
    client.emit(
      ServiceEvents.INDEX_BLOCK_RANGE,
      { blockFrom: 14316460, blockTo: 14316461, reread: false },
    );

    await setTimeout(5000);

    const contractsResult = await db.contracts()
      .find({})
      .project({ createdAt: 0, updatedAt: 0 })
      .sort({ _id: MongoSort.ASC })
      .toArray();

    const tokensResult = await db.tokens()
      .find({})
      .project({ createdAt: 0, updatedAt: 0 })
      .sort({ _id: MongoSort.ASC })
      .toArray();

    expect(tokensResult).toMatchSnapshot();
    expect(contractsResult).toMatchSnapshot();
  });
});

import { setTimeout } from 'timers/promises';
import { v4 as uuid } from 'uuid';

process.env.RABBIT_BLOCK_READ_QUEUE = `test-queue-${uuid()}`;

import { ethers } from 'ethers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { IIndexerConfig, getIndexerConfig } from '@app-indexer/app.config';
import { TokenProcessorProvider } from '@app-indexer/token-processor/token-processor.provider';
import * as nfts from '@shared/nfts';
import { ContractsRepo } from '@shared/contracts';
import { DB, DBClass, IDatabaseConfig, MongoSort, getDatabaseConfig } from '@shared/db';
import { clientFactory } from '@shared/microservices/client-factory';
import { TokensRepo } from '@shared/tokens';
import { Web3Provider } from '@shared/web3';
import { fixtureEvents } from './fixtures';

jest.mock('@shared/nfts', () => {
  const original = jest.requireActual('@shared/nfts');

  return {
    ...original,
    getContractInstance: jest.fn(),
  };
});

jest.setTimeout(100000);

describe('[app-indexer]', () => {
  let db: DBClass;
  let client: ClientProxy;
  let tokensRepo: TokensRepo;
  let tokenProcessorProvider: TokenProcessorProvider;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `app-indexer-test-${dbConfig.db}` });
    await db.open();

    tokensRepo = new TokensRepo(db);
    const contractsRepo = new ContractsRepo(db);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ getIndexerConfig ],
          isGlobal: true,
        }),
      ],
      providers: [ ConfigService ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    const configService = moduleRef.get<ConfigService<IIndexerConfig>>(ConfigService<IIndexerConfig>);

    client = await clientFactory(configService, 'blocksQueue');
    const web3Provider = new Web3Provider<IIndexerConfig>(configService);

    tokenProcessorProvider = new TokenProcessorProvider(
      web3Provider,
      client,
      contractsRepo,
      tokensRepo,
      configService,
    );

    await Promise.all([
      db.events().deleteMany({}),
      db.tokens().deleteMany({}),
      db.contracts().deleteMany({}),
    ]);
    await db.events().insertMany(fixtureEvents);
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
    await setTimeout(1000);
    await client.close();
  });

  it('should check if events indexed and tokens and contracts in the database', async () => {
    jest.spyOn(nfts, 'getContractInstance').mockImplementation((...args) => {
      return {
        address: args[0] as string,
      } as unknown as ethers.Contract;
    });

    const events = await db.events().find({}).toArray();
    await tokenProcessorProvider.process(14316460, 14316461, events);

    // removed the createdAt date from the documents, as it will constantly change
    const contractsResult = await db.contracts()
      .find({})
      .sort({ _id: MongoSort.ASC })
      .project({ createdAt: 0, updatedAt: 0, name: 0 })
      .toArray();

    const tokensResult = await db.tokens()
      .find({})
      .sort({ _id: MongoSort.ASC })
      .project({ createdAt: 0, updatedAt: 0, tokenUri: 0 })
      .toArray();

    expect(tokensResult).toMatchSnapshot();
    expect(contractsResult).toMatchSnapshot();
  });
});

import { getContractReaderConfig } from '@app-contract-reader/app.config';
import { ContractReaderModule } from '@app-contract-reader/contract-reader';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { IBaseConfig } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { ContractEventData, ServiceEvents, TokenEventData, bootstrapMicroservice, clientFactory } from '@shared/microservices';
import * as nfts from '@shared/nfts';
import { TokenMetadataStatus } from '@shared/tokens';
import { ethers } from 'ethers';
import { lastValueFrom } from 'rxjs';
import { setTimeout } from 'timers/promises';
import { v4 as uuid } from 'uuid';
import { fixtureContracts } from './fixtures/contracts.fixture';
import { fixtureTokens } from './fixtures/tokens.fixtures';

process.env.RABBIT_CONTRACT_READ_QUEUE = `test-queue-${uuid()}`;

jest.mock('@shared/opensea', () => {
  const original = jest.requireActual('@shared/opensea');

  return {
    ...original,
    OpenseaClient: class {
      getOpenseaCollectionImageUrl() {
        return 'url';
      }
    },
  };
});

jest.mock('@shared/nfts', () => {
  const original = jest.requireActual('@shared/nfts'); // Step 2.

  return {
    ...original,
    getContractInstance: jest.fn(),
  };
});

jest.setTimeout(100000);

describe('[contract-reader queue]', () => {
  let app: INestApplication;
  let db: DBClass;
  let client: ClientProxy;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `contract-reader-${dbConfig.db}` });
    await db.open();

    await Promise.all([
      db.tokens().deleteMany({}),
      db.contracts().deleteMany({}),
    ]);
    await Promise.all([
      db.tokens().insertMany(fixtureTokens.map((fixture) => ({
        _id: fixture._id,
        block: fixture.block,
        count: fixture.count,
        from: '0x95d35C8a511F5877Af28B515ab4f0A03B730ae9C',
        tokenMetadataStatus: TokenMetadataStatus.UNDEFINED,
        retryCount: 0,
        createdAt: fixture.createdAt,
        tokenUri: '',
      }))),
      db.contracts().insertMany(fixtureContracts.map((fixture) => ({
        ...fixture,
        name: '',
      }))),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ContractReaderModule,
        ConfigModule.forRoot({
          load: [ getContractReaderConfig ],
          isGlobal: true,
        }),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();

    const configService = moduleRef.get<ConfigService<IBaseConfig>>(ConfigService<IBaseConfig>);

    await bootstrapMicroservice(app, 'contractsQueue');
    await app.listen(8083);

    client = clientFactory(configService, 'contractsQueue');
    await client.connect();
  });

  it('should successfully consume messages from queue', async () => {
    jest.spyOn(nfts, 'getContractInstance').mockImplementation((...args) => {
      return {
        address: args[0] as string,
        name: () => new Promise((resolve) => resolve(args[0])),
        tokenURI: (id: string) => new Promise((resolve) => resolve(`https://tokenUri/${id}`)),
        uri: (id: string) => new Promise((resolve) => resolve(`https://uri/${id}`)),
        tokenMetadata: (id: string) => new Promise((resolve) => resolve(`https://tokenMetadata/${id}`)),
      } as unknown as ethers.Contract;
    });

    for (let i = 0; i < fixtureContracts.length; i++) {
      const fixtureContract = fixtureContracts[i];
      const [ blockchainName, contractAddress ] = fixtureContract._id.split(':');

      const contractEvent: ContractEventData = {
        blockchainName: blockchainName as Blockchain,
        blockNumber: fixtureContract.block,
        contractAddress,
        contractType: fixtureContract.type,
      };

      const observable = client.emit(ServiceEvents.READ_CONTRACT, contractEvent);

      await lastValueFrom(observable);
    }

    for (let i = 0; i < fixtureTokens.length; i++) {
      const fixtureToken = fixtureTokens[i];
      const [ blockchainName, contractAddress, tokenId ] = fixtureToken._id.split(':');

      const tokenEvent: TokenEventData = {
        blockchainName: blockchainName as Blockchain,
        blockNumber: fixtureToken.block,
        contractAddress,
        contractType: fixtureToken.contractType,
        tokenId,
      };

      const observable = client.emit(ServiceEvents.READ_TOKEN, tokenEvent);

      await lastValueFrom(observable);
    }

    await setTimeout(5000);

    const contractsResult = await db.contracts().find({}).project({ createdAt: 0, updatedAt: 0, 'collectionImage.updatedAt': 0 }).toArray();
    const tokensResult = await db.tokens().find({}).project({ createdAt: 0, updatedAt: 0 }).toArray();

    expect(contractsResult).toMatchSnapshot();
    expect(tokensResult).toMatchSnapshot();
  });

  afterAll(async () => {
    await db.tokens().deleteMany({});
    await db.contracts().deleteMany({});
    await db.close(true);
    await client.close();
    await setTimeout(1000);
    await app.close();
  });
});

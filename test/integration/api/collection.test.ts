import { CollectionModule } from '@api/collection';
import { HttpServer, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Blockchain } from '@shared/blockchain';
import { ContractsRepo } from '@shared/contracts';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { TokenStandard } from '@shared/tokens';
import { UpdateResult } from 'mongodb';
import { LoggerModule } from 'nestjs-pino';
import nock from 'nock';
import request from 'supertest';
import { getNestApp } from '../../helpers/app';
import { staxResponseFixture } from './fixtures';
import { ConfigModule } from '@nestjs/config';
import { getApiConfig } from '@api/app.config';
import { openseaResponseFixture } from './fixtures/opensea-response.fixture';

const collection = openseaResponseFixture.collection;

nock('https://test.opensea/').persist().get(/.*/).reply(200, { collection });

async function seedContractsRepo(db: DB): Promise<UpdateResult[]> {
  const contractsRepo = new ContractsRepo(db);

  const contractsList = [
    {
      blockchain: Blockchain.ETH,
      address: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
      type: TokenStandard.ERC1155,
      name: 'Superlative Mutated Apes',
      block: 14316461,
      createdAt: new Date(),
    },
    {
      blockchain: Blockchain.ETH,
      address: '0x20Cc3Bd22144209CF93dA14017C506b0ed0F3e4c',
      type: TokenStandard.ERC721,
      name: 'Audiovisions',
      block: 14316461,
      createdAt: new Date(),
    },
    {
      blockchain: Blockchain.ETH,
      address: '0x83d062769d78deD9B051E69c80fA6CC091dbF27B',
      type: TokenStandard.ERC721,
      name: 'MavionWorld',
      block: 14316467,
      createdAt: new Date(),
    },
  ];

  return Promise.all(
    contractsList.map((item) => contractsRepo.insertIfNone(item)),
  );
}

jest.setTimeout(50000);

describe('[Collection endpoint]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let db: DB;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `api-collection-test-${dbConfig.db}` });
    await db.open();

    const moduleRef = await Test.createTestingModule({
      imports: [
        CollectionModule,
        LoggerModule.forRoot(),
        ConfigModule.forRoot({
          load: [ getApiConfig ],
          isGlobal: true,
        }),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();

    nock('https://test.stax')
      .persist()
      .get(/.*/)
      .reply(200, { staxResponseFixture });
  });

  describe('[GET /api/v0/:chainName/contracts/:contractId]', () => {
    it('should return 404 error if requested item doesn`t exist in our DB', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/eth/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(404);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return 400 error if validation doesn`t pass', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v0/solana/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct results based on params', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v0/eth/contracts/0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v0/eth/contracts/0x20Cc3Bd22144209CF93dA14017C506b0ed0F3e4c')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v0/eth/contracts/0x83d062769d78deD9B051E69c80fA6CC091dbF27B')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();
      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });

    it('should return correct results even if contract address is not checksum formatted', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v0/eth/contracts/0x9fb2eeb75754815c5cc9092cd53549cea5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v0/eth/contracts/0X20Cc3Bd22144209CF93dA14017C506b0ed0F3e4C')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v0/eth/contracts/0x83d062769d78ded9b051e69c80fa6cc091dbf27b')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();

      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();

      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });
  });

  describe('[GET /api/v1/:chainName/contracts/:contractId]', () => {
    it('should return 404 error if requested item doesn`t exist in our DB', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v1/eth/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(404);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return 400 error if validation doesn`t pass', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v1/solana/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct results based on params', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v1/eth/contracts/0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v1/eth/contracts/0x20Cc3Bd22144209CF93dA14017C506b0ed0F3e4c')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v1/eth/contracts/0x83d062769d78deD9B051E69c80fA6CC091dbF27B')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();
      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });

    it('should return correct results even if contract address is not checksum formatted', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v1/eth/contracts/0x9fb2eeb75754815c5cc9092cd53549cea5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v1/eth/contracts/0X20Cc3Bd22144209CF93dA14017C506b0ed0F3e4C')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v1/eth/contracts/0x83d062769d78ded9b051e69c80fa6cc091dbf27b')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();

      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();

      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });
  });

  describe('[GET /api/v2/:chainName/contracts/:contractId]', () => {
    it('should return 404 error if requested item doesn`t exist in our DB', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v2/eth/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(404);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return 400 error if validation doesn`t pass', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v2/solana/contracts/0x33EeCbf908478C10614626A9D304bfe18B78DD73',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct results based on params', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v2/eth/contracts/0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v2/eth/contracts/0x20Cc3Bd22144209CF93dA14017C506b0ed0F3e4c')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v2/eth/contracts/0x83d062769d78deD9B051E69c80fA6CC091dbF27B')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();
      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });

    it('should return correct results even if contract address is not checksum formatted', async () => {
      await seedContractsRepo(db);

      const actualResult1 = await request(httpServer)
        .get('/api/v2/eth/contracts/0x9fb2eeb75754815c5cc9092cd53549cea5dc404f')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v2/eth/contracts/0X20Cc3Bd22144209CF93dA14017C506b0ed0F3e4C')
        .set('Accept', 'application/json');

      const actualResult3 = await request(httpServer)
        .get('/api/v2/eth/contracts/0x83d062769d78ded9b051e69c80fa6cc091dbf27b')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();

      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();

      expect(actualResult3.statusCode).toBe(200);
      expect(actualResult3.body).toMatchSnapshot();
    });
  });

  afterEach(async () => {
    await db.contracts().deleteMany({});
  });

  afterAll(async () => {
    nock.cleanAll();
    await app.close();
  });
});

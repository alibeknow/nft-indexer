process.env.METADATA_REPO_PROVIDER = 'mongo';

import { getApiConfig } from '@api/app.config';
import { MetadataModule } from '@api/metadata';
import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Blockchain } from '@shared/blockchain';
import { ContractsRepo } from '@shared/contracts';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { Metadata, MetadataRepoDB } from '@shared/metadata';
import { TokenStandard, TokensRepo } from '@shared/tokens';
import { LoggerModule } from 'nestjs-pino';
import nock from 'nock';
import request from 'supertest';
import { getNestApp } from '../../helpers/app';
import { fixtureMetdata } from '../fixtures/fixtures.metadata';
import { fixtureApiTokens } from '../fixtures/token.api.fixture';
import { staxResponseFixture } from './fixtures';

async function seedMetadataRepo(db: DBClass): Promise<(Metadata | null)[]> {
  const metadataRepo = new MetadataRepoDB(db);
  const contractRepo = new ContractsRepo(db);
  const tokenRepo = new TokensRepo(db);
  await contractRepo.insertIfNone({
    blockchain: Blockchain.ETH,
    address: '0xE1E484251ffFee048A839bc2d68C160BD8C82aBB',
    block: 15177280,
    name: 'Lost Illusion',
    type: TokenStandard.ERC721,
    createdAt: new Date(),
  });
  await contractRepo.insertIfNone({
    blockchain: Blockchain.ETH,
    address: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
    block: 15177280,
    name: 'Lost Illusion',
    type: TokenStandard.ERC721,
    createdAt: new Date(),
  });

  await Promise.all(
    fixtureApiTokens.map((token) => {
      const [ , contractAddress, tokenId ] = token._id.split(':');
      tokenRepo.save({
        block: token.block,
        blockchain: Blockchain.ETH,
        from: '0x95d35C8a511F5877Af28B515ab4f0A03B730ae9C',
        contractAddress,
        tokenId,
        count: token.count,
        createdAt: token.createdAt,
        tokenUri: token.tokenUri,
      });
    }),
  );

  return Promise.all(
    fixtureMetdata.map(({ _id, metadata, type }) =>
      metadataRepo.save(_id, metadata, type),
    ),
  );
}

jest.setTimeout(100000);

describe('[Metadata endpoints]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `api-metadata-test-${dbConfig.db}` });
    await db.open();

    await db.metadata().deleteMany({});
    await db.tokens().deleteMany({});
    await db.contracts().deleteMany({});
    await seedMetadataRepo(db);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ getApiConfig ],
          isGlobal: true,
        }),
        MetadataModule,
        LoggerModule.forRoot(),
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

  describe('[GET /api/v1/:chainName/metadata/:contractAddress/:tokenId]', () => {
    it('should return 404 error if requested item doesn`t exist in our DB', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v1/eth/metadata/0x33EeCbf908478C10614626A9D304bfe18B78DD73/0x74727e18',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(404);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return 400 error if validation doesn`t pass', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v0/solana/metadata/0x33EeCbf908478C10614626A9D304bfe18B78DD73/0x74727e18',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct result based on request params', async () => {
      const actualResult1 = await request(httpServer)
        .get(
          '/api/v1/eth/metadata/0xE1E484251ffFee048A839bc2d68C160BD8C82aBB/0x0441',
        )
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });

    it('should return correct result based on request params even if a contract address is not checksum formatted', async () => {
      const actualResult1 = await request(httpServer)
        .get(
          `/api/v1/eth/metadata/${'0xE1E484251ffFee048A839bc2d68C160BD8C82aBB'.toLowerCase()}/0x0441`,
        )
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });
  });

  describe('[GET /api/v0/:chainName/metadata/:contractAddress]', () => {
    it('should return 400 error if requests doesn`t pass validation', async () => {
      const actualResult1 = await request(httpServer)
        .get('/api/v0/eth/metadata/0x33EeCbf908478C10614626A9D304bfe18B78DD73')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get(
          '/api/v0/solana/metadata/0x33EeCbf908478C10614626A9D304bfe18B78DD73?tokenIds=0x5b',
        )
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(400);
      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(400);
      expect(actualResult2.body).toMatchSnapshot();
    });

    it('should return correct results based on params and query params', async () => {
      const actualResult1 = await request(httpServer)
        .get(
          '/api/v0/eth/metadata/0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f?tokenIds=0x0340,0x0341',
        )
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get(
          '/api/v0/eth/metadata/0x0e28B28681B1C6b58561A97720F50176ECA387E5?tokenIds=0x2612',
        )
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body).toMatchSnapshot();
    });

    it('should return correct results based on params and query params even if contract address is not checksum formatted', async () => {
      const actualResult1 = await request(httpServer)
        .get(
          `/api/v0/eth/metadata/${'0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f'.toLowerCase()}?tokenIds=0x0340,0x0341`,
        )
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get(
          '/api/v0/eth/metadata/0X0e28B28681B1C6b58561A97720f50176eca387E5?tokenIds=0x2612',
        )
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);

      expect(actualResult1.body).toMatchSnapshot();
      expect(actualResult2.statusCode).toBe(200);

      expect(actualResult2.body).toMatchSnapshot();
    });
  });

  afterAll(async () => {
    nock.cleanAll();
    await db.close(true);
    await app.close();
  });
});

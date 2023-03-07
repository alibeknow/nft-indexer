import { v4 as uuid } from 'uuid';
process.env.METADATA_REPO_PROVIDER = 'mongo';
process.env.RABBIT_METADATA_READ_QUEUE = `test-queue-${uuid()}`;
process.env.COMMUNICATION_TRANSPORT = 'rmq';

import { IApiConfig, getApiConfig } from '@api/app.config';
import { RefreshModule } from '@api/refresh';
import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Blockchain } from '@shared/blockchain';
import { ContractsRepo } from '@shared/contracts';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { Metadata, MetadataRepoDB } from '@shared/metadata';
import { IRabbitConfig } from '@shared/microservices';
import { TokenStandard, TokensRepo } from '@shared/tokens';
import * as amqplib from 'amqplib';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { getNestApp } from '../../helpers/app';
import { fixtureMetdata } from '../fixtures/fixtures.metadata';
import { fixtureApiTokens } from '../fixtures/token.api.fixture';

async function seedMetadataRepo(db: DBClass): Promise<(Metadata | null)[]> {
  const metadataRepo = new MetadataRepoDB(db);
  const contractRepo = new ContractsRepo(db);
  const tokenRepo = new TokensRepo(db);
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

jest.setTimeout(60000);

describe('[Metadata endpoints]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let db: DBClass;
  let amqpClient: amqplib.Channel;
  let amqpConn: amqplib.Connection;
  let metadataQueue: string;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `api-refresh-test-${dbConfig.db}` });
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
        RefreshModule,
        LoggerModule.forRoot(),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    const configService = moduleRef.get<ConfigService<IApiConfig>>(
      ConfigService<IApiConfig>,
    );
    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();

    const configRabbit = configService.get<IRabbitConfig>(
      'rabbit',
    ) as IRabbitConfig;

    const { protocol, username, password, host, port } = configRabbit;

    metadataQueue = configRabbit.metadataQueue;
    if (username && password) {
      amqpConn = await amqplib.connect(
        `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(
          password,
        )}@${host}:${port}`,
      );
    } else {
      amqpConn = await amqplib.connect(`${protocol}://${host}:${port}`);
    }
    amqpClient = await amqpConn.createChannel();
    await amqpClient.assertQueue(metadataQueue, { durable: false });
  });

  describe('[POST /api/v0/refresh/contract]', () => {
    it('should return correct result based on request params and body', async () => {
      const actualResult1 = await request(httpServer)
        .post('/api/v0/refresh/contract')
        .send({
          chainName: 'eth',
          contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
        })
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });

    it('should return correct result based on request params and body with non-checksum formatted contract address', async () => {
      const actualResult1 = await request(httpServer)
        .post('/api/v0/refresh/contract')
        .send({
          chainName: 'eth',
          contractAddress: '0x9fb2eeb75754815c5cc9092cd53549cea5dc404f',
        })
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });
  });

  describe('[POST /api/v0/refresh/token]', () => {
    it('should return correct results based on params and body', async () => {
      const actualResult1 = await request(httpServer)
        .post('/api/v0/refresh/token')
        .send({
          chainName: 'eth',
          contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
          tokenId: '0x04',
        })
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });

    it('should return correct results based on params and body with non-checksum formatted contract address', async () => {
      const actualResult1 = await request(httpServer)
        .post('/api/v0/refresh/token')
        .send({
          chainName: 'eth',
          contractAddress: '0X9FB2EEB75754815C5CC9092CD53549CEA5DC404F',
          tokenId: '0x04',
        })
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body).toMatchSnapshot();
    });

    // eslint-disable-next-line jest/no-done-callback, linebreak-style
    it('should send message to queue token API', (done: jest.DoneCallback) => {
      let counter = 0;
      request(httpServer)
        .post('/api/v0/refresh/token')
        .send({
          chainName: 'eth',
          contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
          tokenId: '0x04',
        })
        .set('Accept', 'application/json')
        .expect(() => {
          amqpClient.consume(metadataQueue, (msg) => {
            if (msg !== null) {
              counter++;
              amqpClient.ack(msg);
              // eslint-disable-next-line jest/no-conditional-expect
              expect(counter).toBe(1);
              done();
            }
          });
        })
        .end((err) => done(err));
    });

    //eslint-disable-next-line jest/no-done-callback, linebreak-style
    it('should send message to queue contract API', (done: jest.DoneCallback) => {
      let counter = 0;
      request(httpServer)
        .post('/api/v0/refresh/contract')
        .send({
          chainName: 'eth',
          contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
        })
        .set('Accept', 'application/json')
        .expect(() => {
          amqpClient.consume(metadataQueue, (msg) => {
            if (msg !== null) {
              counter++;
              amqpClient.ack(msg);
              // eslint-disable-next-line jest/no-conditional-expect
              expect(counter).toBe(1);
              done();
            }
          });
        })
        .end((err) => done(err));
    });
  });

  afterAll(async () => {
    await db.metadata().deleteMany({});
    await db.tokens().deleteMany({});
    await db.contracts().deleteMany({});
    await db.close(true);
    await app.close();
    await amqpConn.close();
  });
});

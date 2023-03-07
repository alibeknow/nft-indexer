import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { IApiConfig, getApiConfig } from '@api/app.config';
import { WalletModule } from '@api/wallet';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { Blockchain } from '@shared/blockchain';
import { ExplorerEvent, ExplorersClient } from '@shared/explorers-client';
import { Metadata, MetadataRepoDB } from '@shared/metadata';
import { getNestApp } from '../../helpers/app';

import {
  explorersApiErc1155EventsFixture,
  explorersApiErc721And1155EventsFixture,
  explorersApiErc721EventsFixture,
  metadataDbFixture,
} from './fixtures';

jest.setTimeout(50000);

const TRANSFER_EVENT_ID = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TRANSFER_BATCH_EVENT_ID = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';

async function seedMetadataRepo(db: DBClass): Promise<(Metadata | null)[]> {
  const metadataRepo = new MetadataRepoDB(db);

  return Promise.all(metadataDbFixture.map(
    ({ _id, metadata, type }) => metadataRepo.save(_id, metadata, type)),
  );
}

describe('Wallet endpoints', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let db: DBClass;
  let explorersClient: ExplorersClient<IApiConfig>;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `api-wallet-test-${dbConfig.db}` });
    await db.open();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ getApiConfig ],
          isGlobal: true,
        }),
        WalletModule,
        LoggerModule.forRoot({ pinoHttp: { enabled: false } }),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();
    explorersClient = app.get<ExplorersClient<IApiConfig>>(ExplorersClient<IApiConfig>);
  });

  afterEach(async () => {
    await db.metadata().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
    await app.close();
  });

  describe('[GET /api/v0/:chainName/wallet/:address/nfts]', () => {
    it('should return validation error if wrong address is passed', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/fake-addrs/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return validation error if wrong chain name is passed', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/fake-chain-name/wallet/0x7732920c57ed119f5000f7bd3a34a954b7932ed2/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return validation error if incorrect query params were passed', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x7732920c57ed119f5000f7bd3a34a954b7932ed2/nfts?page=0&limit=some-limit')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(400);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return empty array if explorers api returns no events', async () => {
      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async () => {
        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x7732920c57ed119f5000f7bd3a34a954b7932ed2/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct result for erc-721 tokens', async () => {
      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_EVENT_ID) {
          return explorersApiErc721EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x47ba73787ea555cafbf1c4472b03471c73e46e76/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct result for erc-1155 tokens', async () => {
      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_BATCH_EVENT_ID) {
          return explorersApiErc1155EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x3ee13342db4bc021233f9e9f5c83d7e0f0995ae3/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct result for erc-1155 and erc-721 tokens at the same time', async () => {
      await seedMetadataRepo(db);

      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_BATCH_EVENT_ID) {
          return explorersApiErc721And1155EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x14e27b3f72721aabe20e4ec713e65e49422012da/nfts')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct results based on page and limit query params', async () => {
      await seedMetadataRepo(db);

      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_BATCH_EVENT_ID) {
          return explorersApiErc721And1155EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult1 = await request(httpServer)
        .get('/api/v0/eth/wallet/0x14e27b3f72721aabe20e4ec713e65e49422012da/nfts?page=2&limit=4')
        .set('Accept', 'application/json');

      const actualResult2 = await request(httpServer)
        .get('/api/v0/eth/wallet/0x14e27b3f72721aabe20e4ec713e65e49422012da/nfts?page=1&limit=3')
        .set('Accept', 'application/json');

      expect(actualResult1.statusCode).toBe(200);
      expect(actualResult1.body.result).toHaveLength(4);
      expect(actualResult1.body).toMatchSnapshot();

      expect(actualResult2.statusCode).toBe(200);
      expect(actualResult2.body.result).toHaveLength(3);
      expect(actualResult2.body).toMatchSnapshot();
    });

    it('should return correct results based on contractAddress query param', async () => {
      await seedMetadataRepo(db);

      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_BATCH_EVENT_ID) {
          return explorersApiErc721And1155EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0x14e27b3f72721aabe20e4ec713e65e49422012da/nfts?contractAddress=0x5090AF9eE4c65f250706972089445C9D78e31274')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body.result).toHaveLength(2);
      expect(actualResult.body).toMatchSnapshot();
    });

    it('should return correct results based on non-checksum formatted contractAddress query param', async () => {
      await seedMetadataRepo(db);

      jest.spyOn(explorersClient, 'fetchWalletEvents').mockImplementation(async (
        chainName: Blockchain, walletAddress: string, eventSignature: string,
      ) => {
        if(eventSignature === TRANSFER_BATCH_EVENT_ID) {
          return explorersApiErc721And1155EventsFixture as unknown as ExplorerEvent[];
        }

        return [];
      });

      const actualResult = await request(httpServer)
        .get('/api/v0/eth/wallet/0X14e27b3f72721aabe20e4ec713e65e49422012da/nfts?contractAddress=0X5090af9eE4C65F250706972089445c9D78e31274')
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body.result).toHaveLength(2);
      expect(actualResult.body).toMatchSnapshot();
    });
  });
});

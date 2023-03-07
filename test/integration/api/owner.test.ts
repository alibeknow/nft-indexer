process.env.METADATA_REPO_PROVIDER = 'mongo';

import { getApiConfig } from '@api/app.config';
import { OwnerModule } from '@api/owner';
import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DB, DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { getNestApp } from '../../helpers/app';

jest.setTimeout(50000);

describe('[Owner endpoints]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `api-owner-test-${dbConfig.db}` });
    await db.open();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ getApiConfig ],
          isGlobal: true,
        }),
        OwnerModule,
        LoggerModule.forRoot(),
      ],
    })
      .overrideProvider(DB)
      .useValue(db)
      .compile();

    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await db.close(true);
    await app.close();
  });

  describe('[GET /api/v0/:chainName/owners/:contractAddress/:tokenId]', () => {
    it('should return correct results based on the input', async () => {
      const actualResult = await request(httpServer)
        .get(
          '/api/v0/eth/owners/0x33EeCbf908478C10614626A9D304bfe18B78DD73/0x74727e18',
        )
        .set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });
  });
});

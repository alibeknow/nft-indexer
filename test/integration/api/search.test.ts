import { getApiConfig } from '@api/app.config';
import { SearchModule } from '@api/search';
import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IBaseConfig } from '@shared/baseconfig';
import { IMetadataIndex, mapToSearchIndex } from '@shared/metadata';
import { OpensearchModule, OpensearchProvider } from '@shared/opensearch';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { setTimeout } from 'timers/promises';
import { getNestApp } from '../../helpers/app';
import { fixtureMetdata } from '../fixtures/fixtures.metadata';

function seedMetadataOpenSearch(
  opensearch: OpensearchProvider<IBaseConfig>,
  indexname: string,
) {
  return Promise.all(
    fixtureMetdata.map(({ _id, metadata, type }) => {
      const modifiedData = mapToSearchIndex({ _id, metadata, type });
      opensearch
        .addDocumentToIndex(indexname, _id, modifiedData as IMetadataIndex)
        .then((): void => {
          return;
        });
    }),
  );
}

jest.setTimeout(20000);

describe('[Search endpoints]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let opensearchService: OpensearchProvider<IBaseConfig>;
  const indexName = 'metadatatest';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ getApiConfig ],
          isGlobal: true,
        }),
        OpensearchModule,
        SearchModule,
        LoggerModule.forRoot(),
      ],
    }).compile();

    opensearchService = moduleRef.get<OpensearchProvider<IBaseConfig>>(
      OpensearchProvider<IBaseConfig>,
    );
    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await seedMetadataOpenSearch(opensearchService, indexName);
  });

  describe('[GET /api/v0/search/metadata]', () => {
    it('should return 200', async () => {
      await setTimeout(5000);
      const actualResult = await request(httpServer)
        .get(
          '/api/v0/search/metadata?q=The Seagull&filter=name&chain=eth&contractAddress=0x0e28B28681B1C6b58561A97720F50176ECA387E5',
        )
        .set('Accept', 'application/json');
      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body.result.total).toBe(2);
    });

    it('should allow valid from and size paramters', async () => {
      await setTimeout(5000);
      const indexerResponse = await request(httpServer)
        .get(
          '/api/v0/search/metadata?chain=eth&filter=name&q=test&from=1&size=1&contractAddress=string',
        )
        .set('Accept', 'application/json');

      expect(indexerResponse.status).toBe(200);
      expect(indexerResponse.text).toBe(
        '{"result":{"from":1,"size":1,"total":0,"hits":[]},"statusCode":200}',
      );
    });

    it('error for invalid from paramter', async () => {
      await setTimeout(5000);
      const indexerResponse = await request(httpServer)
        .get(
          '/api/v0/search/metadata?chain=eth&filter=name&q=test&from=foo&size=1&&contractAddress=fakeContract',
        )
        .set('Accept', 'application/json');
      expect(indexerResponse.status).toBe(400);
      expect(indexerResponse.text).toBe(
        '{"statusCode":400,"message":["from must be an integer number"],"error":"Bad Request"}',
      );
    });

    it('error for invalid size paramter', async () => {
      await setTimeout(5000);
      const indexerResponse = await request(httpServer)
        .get(
          '/api/v0/search/metadata?chain=eth&filter=name&q=test&from=1&size=bar&contractAddress=fakeContract',
        )
        .set('Accept', 'application/json');
      expect(indexerResponse.status).toBe(400);
      expect(indexerResponse.text).toBe(
        '{"statusCode":400,"message":["size must be an integer number"],"error":"Bad Request"}',
      );
    });
  });

  afterAll(async () => {
    await opensearchService.removeIndex(indexName);
    await app.close();
  });
});

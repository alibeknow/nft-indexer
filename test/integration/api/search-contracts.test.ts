import request from 'supertest';
import nock from 'nock';
import { getApiConfig } from '@api/app.config';
import { HttpServer, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IBaseConfig } from '@shared/baseconfig';
import { OpensearchModule, OpensearchProvider } from '@shared/opensearch';
import { LoggerModule } from 'nestjs-pino';
import { IContractIndex, mapToSearchContractIndex } from '@shared/contracts/contract-search';
import { getNestApp } from '../../helpers/app';
import { SearchModule } from '@api/search';
import { fixtureContractsDB } from './fixtures/contracts-db.fixture';
import { fixtureTokensDB } from './fixtures/tokens-db.fixture';
import { openseaResponseFixture } from './fixtures/opensea-response.fixture';

const collection = openseaResponseFixture.collection;

nock('https://test.opensea/').persist().get(/.*/).reply(200, { collection });

function seedContractsOpenSearch(opensearch: OpensearchProvider<IBaseConfig>, indexname: string) {
  return Promise.all(fixtureContractsDB.map( async (contract) => {
    const modifiedData = await mapToSearchContractIndex(contract, fixtureTokensDB.length);

    return opensearch
      .addDocumentToIndex(indexname, contract._id, modifiedData as IContractIndex);
  }) );
}

jest.setTimeout(20000);

describe('[Contracts search endpoint]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let opensearchService: OpensearchProvider<IBaseConfig>;
  const indexName = 'contractstest';

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
    opensearchService = moduleRef.get<OpensearchProvider<IBaseConfig>>(OpensearchProvider<IBaseConfig>);
    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await seedContractsOpenSearch(opensearchService, indexName);
  });

  describe('[GET /api/v0/search/contracts]', () => {
    it('should return 200', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/search/contracts?q=Art Blocks&filter=name&chain=eth')
        .set('Accept', 'application/json');

      expect(actualResult.body).toMatchSnapshot();
      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body.result.total).toBe(2);
    });
  });

  describe('[GET /api/v0/search/contracts/address]', () => {
    it('should return 200', async () => {
      const actualResult = await request(httpServer)
        .get('/api/v0/search/contracts/0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f?q=Art Blocks&filter=name&chain=eth')
        .set('Accept', 'application/json');

      expect(actualResult.body).toMatchSnapshot();
      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body.result.total).toBe(1);
    });
  });

  afterAll(async () => {
    await opensearchService.removeIndex(indexName);
    await app.close();
  });
});

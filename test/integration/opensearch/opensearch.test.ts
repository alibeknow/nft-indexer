import { IOpensearchSearchParams, OpensearchProvider, OpensearchSearchFields } from '@shared/opensearch';
import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { fixtureMetdata } from '../fixtures/fixtures.metadata';
import { IMetadataIndex, mapToSearchIndex } from '@shared/metadata';
import { Blockchain } from '@shared/blockchain';
import { MetadataMappings } from '@shared/metadata';
import { ConfigService } from '@nestjs/config';
import { setTimeout } from 'timers/promises';

interface OpensearchResponse {
  status: number;
  [key: string]: unknown;
}

function seedMetadataOpenSearch(opensearch: OpensearchProvider<IBaseConfig>, indexname: string) {
  return Promise.all(fixtureMetdata.map(({ _id, metadata, type }) => {
    const modifiedData = mapToSearchIndex({ _id, metadata, type });
    opensearch
      .addDocumentToIndex(indexname, _id, modifiedData as IMetadataIndex)
      .then((): void => {
        return;
      });
  }) );
}

jest.setTimeout(50000);

describe('Opensearch module', () => {
  let opensearchProvider: OpensearchProvider<IBaseConfig>;
  const indexName = 'metadatatest';

  beforeAll(async () => {
    const baseConfig = new ConfigService<IBaseConfig>(getBaseConfig());
    opensearchProvider = new OpensearchProvider(baseConfig);

    await opensearchProvider.initIndex(indexName, MetadataMappings);
  });

  it('add document to index', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, metadata, type } = fixtureMetdata[0];
    const modifiedData = mapToSearchIndex({ _id, metadata, type }) as IMetadataIndex;

    const response = await opensearchProvider.addDocumentToIndex(indexName, _id, modifiedData) as OpensearchResponse;

    expect(response.statusCode).toBe(201);
  });

  it('should return list of appropriate data on search request', async () => {
    await seedMetadataOpenSearch(opensearchProvider, indexName);

    const params: IOpensearchSearchParams = {
      q: 'ape',
      filter: [ OpensearchSearchFields.Global ],
      chain: Blockchain.ETH,
      from: 0,
      size: 5,
    };

    await setTimeout(5000);
    const response = await opensearchProvider.search(indexName, params);

    expect(response.total).toBe(3);
  });

  it('should return empty list on unavailable data', async () => {
    const params: IOpensearchSearchParams = {
      q: 'No such metadata is available',
      filter: [ OpensearchSearchFields.Name ],
      chain: Blockchain.ETH,
      from: 0,
      size: 5,
    };
    await setTimeout(5000);
    const response = await opensearchProvider.search(indexName, params);

    expect(response.total).toBe(0);
  });

  afterAll(async () => {
    await opensearchProvider.removeIndex(indexName);
    await opensearchProvider.close();
  });
});

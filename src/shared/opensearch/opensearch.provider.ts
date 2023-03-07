import _ from 'lodash';
import { readFileSync } from 'fs';
import { ApiResponse, Client } from '@opensearch-project/opensearch';
import { RequestBody } from '@opensearch-project/opensearch/lib/Transport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';
import { logger } from '@shared/logger';

import { DEFAULT_PAGE_SIZE } from './opensearch.constants';
import { IOpensearchConfig, getOpensearchConnectionUri } from './opensearch.config';
import {
  IOpensearchHit,
  IOpensearchIndexConfiguration,
  IOpensearchQuery,
  IOpensearchSearchParams,
  IOpensearchSearchResult,
  IOpensearchSearchWhereFieldParams,
  ISearchAfterQuery,
  OpensearchSearchFields,
} from './opensearch.types';

@Injectable()
export class OpensearchProvider<T extends IBaseConfig> {
  public provider: Client;
  private config: IOpensearchConfig;

  constructor(private configService: ConfigService<T>) {
    let clientOptions;
    this.config = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
    const opensearchConnectionUri = getOpensearchConnectionUri(this.config);

    if (this.config.caPath) {
      clientOptions = { ssl: { ca: readFileSync(this.config.caPath) } };
    } else {
      clientOptions = { ssl: { rejectUnauthorized: false } };
    }

    this.provider = new Client({
      node: opensearchConnectionUri,

      ...clientOptions,
    });
  }

  private getIndexConfiguration(mappings: Record<string, object>): IOpensearchIndexConfiguration {
    return {
      settings: {
        index: {
          number_of_shards: this.config.numberOfShards,
          number_of_replicas: this.config.numberOfReplicas,
        },
      },
      mappings,
    };
  }

  private async indexExist(indexName: string): Promise<boolean> {
    const result = await this.provider.indices.exists({ index: indexName });

    return result.body;
  }

  private async createIndex(indexName: string, mappings: Record<string, object>): Promise<unknown>{
    const body = this.getIndexConfiguration(mappings);

    return this.provider.indices.create({ index: indexName, body });
  }

  public async initIndex(indexName: string, mappings: Record<string, object>) {
    const indexExist = await this.indexExist(indexName);

    if (!indexExist) {
      logger.info(`Opensearch index not exist: creating ${indexName}`);
      await this.createIndex(indexName, mappings);
      logger.info('Opensearch index created');
    }
  }

  public async addDocumentToIndex<T extends RequestBody>(indexName: string, id: string, data: T): Promise<unknown>{
    return this.provider.index({
      id,
      index: indexName,
      body: data,
      refresh: true,
    });
  }

  public async removeDocumentFromIndex(indexName: string, id: string): Promise<unknown>{
    return this.provider.delete({
      id,
      index: indexName,
      refresh: true,
    });
  }

  public async updateDocumentInIndex<T extends Record<string, unknown>>(indexName: string, id: string, data: T): Promise<unknown>{
    return this.provider.update({
      id,
      index: indexName,
      body: data,
      refresh: true,
    });
  }

  public async bulkOperation<T extends Record<string, unknown>>(indexName: string, data: T[]): Promise<ApiResponse<unknown>>{
    return this.provider.bulk({
      index: indexName,
      body: data,
      refresh: true,
    });
  }

  public removeIndex(indexName: string): Promise<unknown>{
    logger.info(`Opensearch index remove: ${indexName}`);

    return this.provider.indices.delete({ index: indexName });
  }

  public close(): Promise<void> {
    return this.provider.close();
  }

  public async searchWhereFieldExists<T>(indexName: string, options: IOpensearchSearchWhereFieldParams): Promise<IOpensearchSearchResult<T>> {
    const { fieldName, chain, searchAfter, size = DEFAULT_PAGE_SIZE } = options;
    let { from = 0 } = options;

    if (!searchAfter) from = -1;

    const query: ISearchAfterQuery = {
      from,
      size,
      query: {
        bool: {
          must: [
            {
              exists: {
                field: fieldName,
              },
            },
          ],
        },
      },
      search_after: searchAfter,
      sort: [
        { _id: 'asc' },
      ],
    };

    if (chain) {
      query.query.bool.filter = {
        term: {
          chain: chain as Blockchain,
        },
      };
    }

    const searchResult = await this.provider.search({
      index: indexName,
      body: query,
    });

    const total = _.get(searchResult, 'body.hits.total.value', 0);
    const hits = _.get(searchResult, 'body.hits.hits', []);

    return {
      from: -1,
      size,
      total,
      hits: hits.map((hit: IOpensearchHit) => ({
        id: hit._id,
        ...hit._source,
      })) as T[],
    };
  }

  public async search<T>(indexName: string, options: IOpensearchSearchParams): Promise<IOpensearchSearchResult<T>>{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { q, filter, chain, from = 0, size = DEFAULT_PAGE_SIZE } = options;

    let searchFields: OpensearchSearchFields[] | string[];

    if (filter.includes(OpensearchSearchFields.Global)) {
      searchFields = Object.values(OpensearchSearchFields).filter(val => val !== OpensearchSearchFields.Global);
    } else {
      searchFields = filter;
    }

    const query: IOpensearchQuery = {
      from,
      size,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: searchFields,
                operator: 'or',
              },
            },
          ],
        },
      },
    };

    if (chain) {
      query.query.bool.filter = {
        term: {
          chain: chain as Blockchain,
        },
      };
    }

    const searchResult = await this.provider.search({
      index: indexName,
      body: query,
    });

    const total = _.get(searchResult, 'body.hits.total.value', 0);
    const hits = _.get(searchResult, 'body.hits.hits', []);

    return {
      from,
      size,
      total,
      hits: hits.map((hit: IOpensearchHit) => ({
        id: hit._id,
        ...hit._source,
      })) as T[],
    };
  }
}

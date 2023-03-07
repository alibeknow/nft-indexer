import { Blockchain } from '@shared/blockchain';

export interface IOpensearchIndexConfiguration {
  settings: {
    index: {
      number_of_shards: number;
      number_of_replicas: number;
    };
  };
  mappings: Record<string, object>;
}

export interface IOpensearchSearchParams {
  q: string;
  filter: OpensearchSearchFields[] | string[];
  contractAddress?: string;
  chain?: Blockchain;
  from?: number;
  size?: number;
}

export interface IOpensearchSearchWhereFieldParams {
  fieldName: string;
  chain?: Blockchain;
  from?: number;
  size?: number;
  searchAfter?: any[];
}

export interface IOpensearchSearchResult<T> {
  hits: T[];
  from: number;
  size: number;
  total: number;
}

export interface IOpensearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: object;
}

export enum OpensearchSearchFields {
  Name = 'name',
  Description = 'description',
  Attributes = 'attributes',
  Global = 'global',
}

export interface IOpensearchQuery {
  from?: number;
  size?: number;
  query: {
    bool: {
      must: any[];
      filter?: any;
    };
  };
}

export interface ISearchAfterQuery {
  from?: number;
  size?: number;
  query: {
    bool: {
      must: any[];
      filter?: any;
    };
  };
  search_after?: any[];
  sort: any[];
}

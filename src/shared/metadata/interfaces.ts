import { TokenStandard } from '@shared/tokens';
import { Collection } from 'mongodb';

export enum UriProtocol {
  IPFS = 'ipfs',
  HTTP = 'http',
  HTTPS = 'https',
  DATA = 'data',
}

export enum MetadataRepoType {
  S3 = 's3',
  MONGO = 'mongo',
}

export interface ReaderInterface {
  (tokenUri: string): Promise<string> | string;
}

export interface IDB {
  metadata(): Collection<Metadata>;
}

export type Metadata = {
  _id: string;
  metadata: string;
  type: UriProtocol;
};

export interface MetadataId {
  _id: string;
}

export interface MissingMetadataIds {
  missing: string[];
}

export interface IMetadataRepo {
  getWhereIdIn: (ids: string[]) => Promise<Metadata[]>;
  save: (
    tokenId: string,
    metadata: string,
    protocol: UriProtocol
  ) => Promise<Metadata | null>;
}

export interface IMetadataSearchResult {
  token_id: string;
  token_address: string;
  token_uri: string | null;
  metadata: string;
  contract_type: TokenStandard;
  token_hash?: string | null;
  synced_at?: Date | null;
  created_at?: Date | null;
}

export type NftData = {
  description: string;
  external_url: string;
  image: string;
  name: string;
  animation_url: string;
  youtube_url: string;
  attributes: Record<string, unknown>[];
  content: Record<string, string>[];
};

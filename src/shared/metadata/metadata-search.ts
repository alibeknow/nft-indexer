import { Blockchain } from '@shared/blockchain';
import { Contract } from '../contracts';
import { Token } from '../tokens';
import { IMetadataSearchResult, Metadata, NftData } from './interfaces';

export interface IMetadataIndex {
  id?: string;
  name: string;
  description: string;
  attributes: string;
  chain: Blockchain;
  contract_address: string;
}

export const MetadataMappings = {
  properties: {
    name: {
      type: 'text',
      index: true,
    },
    contract_address: {
      type: 'text',
      index: true,
    },
    description: {
      type: 'text',
      index: true,
    },
    attributes: {
      type: 'text',
      index: true,
    },
    chain: {
      type: 'keyword',
      index: true,
    },
  },
};

export const mapToSearchIndex = (metadata: Metadata): IMetadataIndex | null => {
  try {
    const [ chain, contractAddress ] = metadata._id.split(':');
    const metadataData = JSON.parse(metadata.metadata) as NftData;
    let attributesArray: string[] = [];

    metadataData.attributes?.forEach((attribute) => {
      attributesArray = attributesArray.concat(Object.values(attribute).join(' '));
    });
    const attributes = attributesArray.filter((value, index, array) => array.indexOf(value) === index).join(' ');

    return {
      id: metadata._id,
      contract_address: contractAddress,
      name: metadataData.name as string,
      description: metadataData.description,
      attributes,
      chain: chain as Blockchain,
    };
  } catch (error: unknown) {
    console.log('error map to index', error);

    return null;
  }
};

export const mapToSearchResult = (metadata: Metadata, tokensObj: Record<string, Token>, contractsObj: Record<string, Contract>): IMetadataSearchResult | null => {
  try {
    if (!metadata) {
      throw new Error('Metadata id is not defined');
    }

    const [ chain, address, tokenId ] = metadata._id.split(':', 3);
    const token = tokensObj[metadata._id];
    const contract = contractsObj[`${chain}:${address}`];

    return {
      token_id: tokenId,
      token_address: address,
      token_uri: token.tokenUri,
      metadata: metadata.metadata,
      contract_type: contract.type,
      token_hash: null,
      synced_at: null,
      created_at: null,
    };
  } catch (error: unknown) {
    return null;
  }
};

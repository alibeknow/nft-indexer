import { Blockchain } from '@shared/blockchain';
import { TokenStandard } from '@shared/tokens';
import { IContractSearchResult } from './interfaces';
import { Contract } from './repo';

export interface IContractIndex {
  id?: string;
  address: string;
  name: string;
  description: string;
  chain: Blockchain;
  verified: boolean;
  contract_type: TokenStandard;
  number_of_tokens: number;
  block: number;
  collection_image: string;
}

export const ContractMappings = {
  properties: {
    address: {
      type: 'keyword',
      index: true,
    },
    name: {
      type: 'text',
      index: true,
    },
    description: {
      type: 'text',
      index: true,
    },
    chain: {
      type: 'keyword',
      index: true,
    },
    verified: {
      type: 'boolean',
      index: true,
    },
    contract_type: {
      type: 'text',
      index: false,
    },
    number_of_tokens: {
      type: 'integer',
      index: false,
    },
    block: {
      type: 'integer',
      index: false,
    },
    created_at: {
      type: 'text',
      index: false,
    },
    collection_image: {
      type: 'text',
      index: false,
    },
  },
};

export const mapToSearchContractIndex = (contract: Contract, tokensCount: number): IContractIndex | null => {
  try {
    const chain = contract._id.split(':')[0] as Blockchain;
    // FIXME: This is a mock
    const description = '';
    // FIXME: This is a mock
    const verified = false;

    return {
      address: contract.address,
      name: contract.name as string,
      description,
      chain,
      verified,
      contract_type: contract.type,
      number_of_tokens: tokensCount ?? 0,
      block: contract.block,
      collection_image: contract.collectionImage?.url || '',
    };
  } catch (error: unknown) {
    return null;
  }
};

export const mapToSearchContractResult = (contractData: IContractIndex): IContractSearchResult | null => {

  try {
    if (!contractData.id) {
      throw new Error('Contract id is not defined');
    }

    return {
      contract_address: contractData.address,
      contract_name: contractData.name,
      contract_description: contractData.description,
      verified: contractData.verified,
      number_of_tokens: contractData.number_of_tokens,
      contract_type: contractData.contract_type,
      synced_at: null,
      created_at: null,
      collection_image: contractData.collection_image,
    };
  } catch (error: unknown) {
    return null;
  }
};

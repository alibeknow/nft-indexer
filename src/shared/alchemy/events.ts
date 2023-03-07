import { BigNumber, ethers } from 'ethers';
import * as retry from 'retry';
import { logger } from '@shared/logger';
import { ZERO_FROM_ADDRESS } from '@shared/nfts';
import { TokenStandard } from '@shared/tokens';
import {
  ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD,
  ALCHEMY_GET_EVENTS_MAX_TIMEOUT,
  ALCHEMY_GET_EVENTS_MIN_TIMEOUT,
  ALCHEMY_GET_EVENTS_RETRIES,
} from './constants';

type RawContract = {
  address: string;
};

type ERC1115Metadata = {
  tokenId: string;
  value: BigNumber;
};

type Transfer = {
  blockNum: number;
  hash: string;
  from: string;
  to: string;
  erc721TokenId: string;
  erc1155Metadata: ERC1115Metadata[];
  rawContract: RawContract;
};

type AlchemyTransferEventResults = {
  transfers: Transfer[];
  pageKey: string;
};

type RequestParams = {
  fromBlock: string;
  toBlock: string;
  category: Array<string>;
  fromAddress: string;
  pageKey?: string;
};

export type EventResponse = {
  blockNumber: number;
  contractAddress: string;
  ids: string[];
  values: number[];
  type: TokenStandard;
};

/**
* Asynchronously request transfer events from Alchemy
* @param {provider} provider json rpc provider
* @param {number} blockNumberFrom start from block number
* @param {number} blockNumberTo end block number
* @param {string} pageKey
*
* @returns {Promise<AlchemyTransferEventResults>} transfer event data
*/
export async function requestTransferEvents(
  provider: ethers.providers.JsonRpcProvider,
  blockNumberFrom: number,
  blockNumberTo: number,
  pageKey?: string,
): Promise<AlchemyTransferEventResults> {
  let requestParams: RequestParams = {
    fromBlock: BigNumber.from(blockNumberFrom).toHexString(),
    toBlock: BigNumber.from(blockNumberTo).toHexString(),
    fromAddress: ZERO_FROM_ADDRESS,
    category: [
      'erc721',
      'erc1155',
    ],
  };

  if(pageKey) {
    requestParams = { ...requestParams, pageKey };
  }

  const operation = retry.operation({
    retries: ALCHEMY_GET_EVENTS_RETRIES,
    minTimeout: ALCHEMY_GET_EVENTS_MIN_TIMEOUT,
    maxTimeout: ALCHEMY_GET_EVENTS_MAX_TIMEOUT,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt: number) => {
      try {
        logger.info({ from: blockNumberFrom, to: blockNumberTo, msg: `Attempt #${currentAttempt}: requesting Alchemy events with params ${JSON.stringify(requestParams)}` });
        const results = await provider.send(ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD, [ requestParams ]);
        resolve(results);
      } catch (e) {
        if(operation.retry(e as unknown as Error)) {
          logger.error({
            msg: `Error requesting Alchemy events (Attempt #${currentAttempt}). Retrying...`,
            from: blockNumberFrom,
            to: blockNumberTo,
            requestParams: JSON.stringify(requestParams),
            error: e,
          });

          return;
        }

        reject(operation.mainError());
      }
    });
  });
}

/**
* Asynchronously get transfer events data from Alchemy
* @param {number} blockNumberFrom start from block number
* @param {number} blockNumberTo end block number
* @param {provider} provider json rpc provider
*
* @returns {Promise<EventResponse[]>} Transfer event data response
*/
export async function getAlchemyTransferEvents(blockNumberFrom: number, blockNumberTo: number, provider: ethers.providers.JsonRpcProvider): Promise<EventResponse[]> {
  let transfers: Transfer[] = [];
  let results = await requestTransferEvents(provider, blockNumberFrom, blockNumberTo);
  transfers = transfers.concat(results.transfers);

  while (results.pageKey) {
    results = await requestTransferEvents(provider, blockNumberFrom, blockNumberTo, results.pageKey);
    transfers = transfers.concat(results.transfers);
  }

  return transfers.map((item) => {
    const ids: string[] = [];
    const values: number[] = [];
    let type: TokenStandard;

    if (item.erc721TokenId) {
      ids.push(item.erc721TokenId);
      values.push(1);
      type = TokenStandard.ERC721;
    } else {
      item.erc1155Metadata.forEach(m => {
        ids.push(m.tokenId);
        values.push(+m.value.toString());
      });
      type = TokenStandard.ERC1155;
    }

    return {
      blockNumber: item.blockNum,
      contractAddress: item.rawContract.address,
      ids,
      values,
      type,
    };
  });
}

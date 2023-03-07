import { BigNumber, ethers } from 'ethers';
import * as retry from 'retry';
import { CONTRACT_OBJECTS } from '@shared/pre-721';
import { logger } from '@shared/logger';
import { TokenStandard } from '@shared/tokens';
import {
  ETH_NODE_GET_LOGS_MAX_TIMEOUT,
  ETH_NODE_GET_LOGS_MIN_TIMEOUT,
  ETH_NODE_GET_LOGS_RETRIES,
} from './constants';
import {
  ERC_1155_TRANSFER_BATCH_SIG,
  ERC_1155_TRANSFER_SINGLE_SIG,
  ERC_721_TRANSFER_SIG,
} from '@shared/contracts';

export type TransferEvent = {
  blockNumber: number;
  logIndex: number;
  transactionHash: string;
  contractAddress: string;
  type: TokenStandard;
  from: string;
  to: string;
  ids: string[];
  values: number[];
};

type ContractInterface = {
  [key: string]: ethers.utils.Interface;
};

/**
* Asynchronously get logs matching the events filter
* @param {ethers.providers.JsonRpcProvider} provider custom provider
* @param {ethers.utils.Interface} iface interface instance from contract abi
* @param {number} blockNumberFrom start from block number
* @param {number} blockNumberTo end block number
*
* @returns {Promise<ethers.providers.Log[]>} Array of logs
*/
export async function getLogs(
  provider: ethers.providers.JsonRpcProvider, blockNumberFrom: number, blockNumberTo: number,
): Promise<ethers.providers.Log[]> {
  const filter = {
    fromBlock: blockNumberFrom,
    toBlock: blockNumberTo,
    topics: [
      [
        ethers.utils.id('Transfer(address,address,uint256)'),
        ethers.utils.id('TransferSingle(address,address,address,uint256,uint256)'),
        ethers.utils.id('TransferBatch(address,address,address,uint256[],uint256[])'),
      ],
    ],
  };

  const operation = retry.operation({
    retries: ETH_NODE_GET_LOGS_RETRIES,
    minTimeout: ETH_NODE_GET_LOGS_MIN_TIMEOUT,
    maxTimeout: ETH_NODE_GET_LOGS_MAX_TIMEOUT,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt: number) => {
      try {
        logger.info({ from: blockNumberFrom, to: blockNumberTo, msg: `Attempt #${currentAttempt}: Requesting ETH node logs...` });
        const logs = await provider.getLogs(filter);
        resolve(logs);
      } catch (e) {
        if (operation.retry(e as unknown as Error)) {
          logger.error({
            from: blockNumberFrom,
            to: blockNumberTo,
            msg: `Error requesting ETH node logs (Attempt #${currentAttempt}): ${e}. Retrying...`,
          });

          return;
        }

        reject(operation.mainError());
      }
    });
  });
}

/**
* Asynchronously get transfer events that matches the log filter and push to array by events topics
* @param {number} blockNumberFrom start from block number
* @param {number} blockNumberTo end block number
* @param {ethers.providers.JsonRpcProvider} provider custom provider
*
* @returns {Promise<TransferEvent[]>} Array of logs
*/
export async function getEthNodeTransferEvents(
  blockNumberFrom: number, blockNumberTo: number, pre721ContractsEnabled: boolean, provider: ethers.providers.JsonRpcProvider,
): Promise<TransferEvent[]> {
  const contractAbi = [
    ERC_721_TRANSFER_SIG,
    ERC_1155_TRANSFER_SINGLE_SIG,
    ERC_1155_TRANSFER_BATCH_SIG,
  ];

  const ifaceDefault = new ethers.utils.Interface(contractAbi);

  const pre721: ContractInterface = {};

  if (pre721ContractsEnabled) {
    for (const contractObject of CONTRACT_OBJECTS) {
      pre721[contractObject.address] = new ethers.utils.Interface(contractObject.abi);
    }
  }

  const logs = await getLogs(provider, blockNumberFrom, blockNumberTo);

  const res: TransferEvent[] = [];
  for (const log of logs) {
    // Because ERC20 and ERC721 Transfer events has identical 0th log topic
    // check if logs topic list length is less than 4 to skip ERC20 Transfer logs
    // which has only 3 topics as token amount is not indexed and stored as data.
    if (log.topics.length !== 4 && !pre721[log.address]) {
      continue;
    }

    let iface: ethers.utils.Interface;
    if (!pre721[log.address]) {
      iface = ifaceDefault;
    } else {
      iface = pre721[log.address];
    }

    const parsedLog = iface.parseLog(log);

    const ids: string[] = [];
    const values: number[] = [];
    let type: TokenStandard;

    switch (parsedLog.name) {
    case 'Transfer':
      ids.push(parseTokenId(parsedLog.args.tokenId));
      values.push(1);
      type = TokenStandard.ERC721;
      break;
    case 'TransferSingle':
      ids.push(parseTokenId(parsedLog.args.id));
      values.push(parseTokenValue(parsedLog.args.value));
      type = TokenStandard.ERC1155;
      break;
    case 'TransferBatch':
      if (parsedLog.args && parsedLog.args.length) {
        ids.push(...parsedLog.args[parsedLog.args.length - 2].map(parseTokenId));
        values.push(...parsedLog.args[parsedLog.args.length - 1].map(parseTokenValue));
        // values keyword is overlapping with ethers function values, so it's the only way to get proper values
      }
      type = TokenStandard.ERC1155;
      break;
    default:
      throw new Error('Not suitable log. Log name is not Transfer, TransferSingle or TransferBatch');
    }

    if (pre721[log.address] && type === TokenStandard.ERC721) {
      type = TokenStandard.PRE721;
    }

    if (pre721[log.address] && type === TokenStandard.ERC1155) {
      type = TokenStandard.PRE1151;
    }

    res.push({
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      transactionHash: log.transactionHash,
      contractAddress: log.address,
      from: parsedLog.args.from,
      to: parsedLog.args.to,
      type,
      ids,
      values,
    });
  }

  return res;
}

/**
* Convert id to hex string
* @param {BigNumber} id
*
* @returns {string} hex string
*/
export function parseTokenId(id: BigNumber): string {
  return id.toHexString();
}

/**
* Convert token value to number
* @param {BigNumber} value
*
* @returns {number} value to number
*/
function parseTokenValue(value: BigNumber): number {
  return +value.toString();
}

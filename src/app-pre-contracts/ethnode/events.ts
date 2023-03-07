import { BigNumber, ethers } from 'ethers';
import * as retry from 'retry';
import { CONTRACT_OBJECTS } from '@shared/pre-721';
import { logger } from '@shared/logger';
import { TokenStandard } from '@shared/tokens';
import {
  ETH_NODE_GET_LOGS_MAX_TIMEOUT,
  ETH_NODE_GET_LOGS_MIN_TIMEOUT,
  ETH_NODE_GET_LOGS_RETRIES,
  ZERO_FROM_ADDRESS,
} from './constants';

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

  const address = [ ...CONTRACT_OBJECTS.map((contract) => {
    return contract.address;
  }) ];

  const filter = {
    fromBlock: fromDecToHex(blockNumberFrom),
    toBlock: fromDecToHex(blockNumberTo),
    address,
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
        const rawLogs = await provider.send('eth_getLogs', [ filter ]);

        const logs: ethers.providers.Log[] = [];

        for (const rawLog of rawLogs) {
          const {
            blockNumber,
            blockHash,
            transactionIndex,
            removed,
            address,
            data,
            topics,
            transactionHash,
            logIndex,
          } = rawLog;

          const log: ethers.providers.Log = {
            blockNumber: fromHexToDec(blockNumber),
            transactionIndex: fromHexToDec(transactionIndex),
            address: ethers.utils.getAddress(address),
            logIndex: fromHexToDec(logIndex),
            blockHash,
            removed,
            data,
            topics,
            transactionHash,
          };

          logs.push(log);
        }

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
* @param {ethers.providers.BaseProvider} provider custom provider
*
* @returns {Promise<TransferEvent[]>} Array of logs
*/
export async function getEthNodeTransferEvents(
  blockNumberFrom: number, blockNumberTo: number, provider: ethers.providers.Web3Provider,
): Promise<TransferEvent[]> {
  const pre721: ContractInterface = {};

  for (const contractObject of CONTRACT_OBJECTS) {
    pre721[contractObject.address] = new ethers.utils.Interface(contractObject.abi);
  }

  const logs = await getLogs(provider, blockNumberFrom, blockNumberTo);

  const res: TransferEvent[] = [];
  for (const log of logs) {
    const iface = pre721[log.address];

    const parsedLog = iface.parseLog(log);
    if (parsedLog.args.from !== ZERO_FROM_ADDRESS) {
      continue;
    }

    const ids: string[] = [];
    const values: number[] = [];
    let type: TokenStandard;

    switch (parsedLog.name) {
    case 'Transfer':
      ids.push(parseTokenId(parsedLog.args.tokenId));
      values.push(1);
      type = TokenStandard.PRE721;
      break;
    case 'TransferSingle':
      ids.push(parseTokenId(parsedLog.args.id));
      values.push(parseTokenValue(parsedLog.args.value));
      type = TokenStandard.PRE1151;
      break;
    case 'TransferBatch':
      if (parsedLog.args && parsedLog.args.length) {
        ids.push(...parsedLog.args[parsedLog.args.length - 2].map(parseTokenId));
        values.push(...parsedLog.args[parsedLog.args.length - 1].map(parseTokenValue));
        // values keyword is overlapping with ethers function values, so it's the only way to get proper values
      }
      type = TokenStandard.PRE1151;
      break;
    default:
      throw new Error('Not suitable log. Log name is not Transfer, TransferSingle or TransferBatch');
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
function parseTokenId(id: BigNumber): string {
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

function fromHexToDec(value: string): number {
  return BigNumber.from(value).toNumber();
}

function fromDecToHex(value: number): string {
  return ethers.utils.hexValue(value);
}

import { logger } from '@shared/logger';
import { ethers } from 'ethers';
import * as retry from 'retry';
import { ETH_NODE_GET_BLOCK_MAX_TIMEOUT, ETH_NODE_GET_BLOCK_MIN_TIMEOUT, ETH_NODE_GET_BLOCK_RETRIES } from './constants';

/**
* Asynchronously get latest block from blockchain
* @param {ethers.providers.BaseProvider} provider Web3 provider
*
* @returns {Promise<number>} Number the latest block number
*/
export async function getLatestBlock(provider: ethers.providers.BaseProvider): Promise<number> {
  const operation = retry.operation({
    retries: ETH_NODE_GET_BLOCK_RETRIES,
    minTimeout: ETH_NODE_GET_BLOCK_MIN_TIMEOUT,
    maxTimeout: ETH_NODE_GET_BLOCK_MAX_TIMEOUT,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt: number) => {
      try {
        logger.info({ msg: `Attempt #${currentAttempt}: Requesting ETH latest block...` });
        const block = await provider.getBlockNumber();
        resolve(block);
      } catch (e) {
        if (operation.retry(e as unknown as Error)) {
          logger.error({
            msg: `Error requesting ETH latest block (Attempt #${currentAttempt}): ${e}. Retrying...`,
          });

          return;
        }

        reject(operation.mainError());
      }
    });
  });
}

export async function getBlock(provider: ethers.providers.BaseProvider, blockNumber: number): Promise<ethers.providers.Block> {
  const operation = retry.operation({
    retries: ETH_NODE_GET_BLOCK_RETRIES,
    minTimeout: ETH_NODE_GET_BLOCK_MIN_TIMEOUT,
    maxTimeout: ETH_NODE_GET_BLOCK_MAX_TIMEOUT,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt: number) => {
      try {
        logger.info({ msg: `Attempt #${currentAttempt}: Requesting ETH block ${blockNumber} data...` });
        const block = await provider.getBlock(blockNumber);
        resolve(block);
      } catch (e) {
        if (operation.retry(e as unknown as Error)) {
          logger.error({
            msg: `Error requesting ETH block ${blockNumber} data (Attempt #${currentAttempt}): ${e}. Retrying...`,
          });

          return;
        }

        reject(operation.mainError());
      }
    });
  });
}

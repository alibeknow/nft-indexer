import { toChecksumAddress } from '@shared/address';
import { BigNumber, ethers } from 'ethers';
import { PinoLogger } from 'nestjs-pino';
import { IApiConfig } from '@api/app.config';
import { Injectable } from '@nestjs/common';
import { Blockchain } from '@shared/blockchain';
import { ExplorersClient } from '@shared/explorers-client';
import {
  ERC_1155_TRANSFER_BATCH_SIG,
  ERC_1155_TRANSFER_SINGLE_SIG,
  ERC_721_TRANSFER_SIG,
} from '@shared/contracts';
import { parseTokenId } from '@shared/ethnode';

/**
 * Wallet Service
 */
@Injectable()
export class WalletService {

  /**
   * WalletService constructor
   * @param {ExplorersClient}
   * @param {PinoLogger}
   */
  constructor(
    private explorersClient: ExplorersClient<IApiConfig>,
    private logger: PinoLogger,
  ) {}

  /**
   * Calculates NFTs ownership for wallet address
   * @param {Blockchain} Chain name
   * @param {string} wallet address
   * @param {number} page
   * @param {number} limit
   * @param {string} contract address to filter results by
   */
  public async getNFTs(chainName: Blockchain, address: string, page: number, limit: number, filterContractAddress: string | undefined): Promise<string[]> {
    const transferId = ethers.utils.id('Transfer(address,address,uint256)');
    const transferSingleId = ethers.utils.id('TransferSingle(address,address,address,uint256,uint256)');
    const transferBatchId = ethers.utils.id('TransferBatch(address,address,address,uint256[],uint256[])');

    const normalizedAddress = toChecksumAddress(address);

    const transferEvents = await this.explorersClient.fetchWalletEvents(chainName, normalizedAddress, transferId);
    const transferSingleEvents = await this.explorersClient.fetchWalletEvents(chainName, normalizedAddress, transferSingleId);
    const transferBatchEvents = await this.explorersClient.fetchWalletEvents(chainName, normalizedAddress, transferBatchId);

    const allEvents = transferEvents.concat(transferSingleEvents, transferBatchEvents);

    const contractAbi = [
      ERC_721_TRANSFER_SIG,
      ERC_1155_TRANSFER_SINGLE_SIG,
      ERC_1155_TRANSFER_BATCH_SIG,
    ];

    const iface = new ethers.utils.Interface(contractAbi);
    const tokensCache: { [key: string]: BigNumber } = {};

    for (let i = allEvents.length; i >= 0; i--) {
      try {
        const item = allEvents[i];
        const topics = [ item.signature, ...item.topics ];
        const event = { ...item, topics };

        const parsedLog = iface.parseLog(event);

        const to = parsedLog.args.to;
        const from = parsedLog.args.from;
        const operator = parsedLog.args.operator;
        const contract = toChecksumAddress(event.contract);

        if(operator === normalizedAddress && from !== normalizedAddress && to !== normalizedAddress) {
          continue;
        }

        let tokenIds: string[] = [];
        let values: BigNumber[] = [];

        switch (event.signature) {
        case transferId:
          tokenIds.push(parseTokenId(parsedLog.args.tokenId));
          values.push(BigNumber.from(1));
          break;
        case transferSingleId:
          tokenIds.push(parseTokenId(parsedLog.args.id));
          values.push(parsedLog.args.value);
          break;
        case transferBatchId:
          tokenIds = parsedLog.args.ids.map(parseTokenId);
          values = parsedLog.args[parsedLog.args.length - 1];
          break;
        }

        if(to === normalizedAddress) {
          tokenIds.forEach((tokenId, index) => {
            const id = `${chainName}:${contract}:${tokenId}`;

            if(tokensCache[id]) {
              const curValue = tokensCache[id];
              const newValue = curValue.add(values[index]);
              tokensCache[id] = newValue;
            } else {
              tokensCache[id] = values[index];
            }
          });
        } else if(from === normalizedAddress) {
          tokenIds.forEach((tokenId, index) => {
            const id = `${chainName}:${contract}:${tokenId}`;

            if(tokensCache[id]) {
              tokensCache[id].sub(values[index]);
              const curValue = tokensCache[id];
              const newValue = curValue.sub(values[index]);
              tokensCache[id] = newValue;
            } else {
              this.logger.error(`Not able to find token ${id}`);
            }
          });
        }

      } catch (err) {
        this.logger.error(err);
      }
    }

    const filtered = Object.entries(tokensCache).reduce<string[]>((memo, [ id, value ]) => {
      const [ , contractAddress  ] = id.split(':');

      if(
        ((filterContractAddress && toChecksumAddress(filterContractAddress) === contractAddress) || !filterContractAddress)
        && value.gt(BigNumber.from(0))
      ) {
        memo.push(id);
      }

      return memo;
    }, []);

    const offset = (page - 1) * limit;

    return filtered.slice(offset, offset + limit);
  }
}

import client from 'prom-client';
import { MongoServerError, WithId } from 'mongodb';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { registry } from '@shared/metrics';
import { MONGO_SERVER_DUPLICATE_KEY_ERROR_CODE } from '@shared/db';
import { logger } from '@shared/logger';
import { WaitGroup } from '@shared/wg';
import { Event } from '@shared/events';
import { TokensRepo } from '@shared/tokens';
import { TokenStandard } from '@shared/tokens';
import { getContractInstance } from '@shared/nfts';
import { ContractsRepo } from '@shared/contracts';
import { Web3Provider } from '@shared/web3';
import { ClientProxy } from '@nestjs/microservices';
import { ContractEventData, MESSAGE_BUS_PROVIDER, ServiceEvents, TokenEventData } from '@shared/microservices';
import { lastValueFrom } from 'rxjs';
import { IIndexerConfig, IServiceConfig } from '../app.config';

const blockCounter = new client.Counter({
  name: 'block_counter',
  help: 'block counter',
  registers: [ registry ],
});
const eventCounter = new client.Counter({
  name: 'event_counter',
  help: 'event counter',
  registers: [ registry ],
});
const erc721EventCounter = new client.Counter({
  name: 'erc721_event_counter',
  help: 'erc721 event counter',
  registers: [ registry ],
});
const erc1155EventCounter = new client.Counter({
  name: 'erc1155_event_counter',
  help: 'erc1155 event counter',
  registers: [ registry ],
});
const contractCounter = new client.Counter({
  name: 'total_contract_counter',
  help: 'total contract counter',
  registers: [ registry ],
});
const erc721ContractCounter = new client.Counter({
  name: 'erc721_contract_counter',
  help: 'erc721 contract counter',
  registers: [ registry ],
});
const erc1155ContractCounter = new client.Counter({
  name: 'erc1155_contract_counter',
  help: 'erc1155 contract counter',
  registers: [ registry ],
});
const erc721TokenCounter = new client.Counter({
  name: 'erc721_token_counter',
  help: 'erc721 token counter',
  registers: [ registry ],
});
const erc1155TokenCounter = new client.Counter({
  name: 'erc1155_token_counter',
  help: 'erc1155 token counter',
  registers: [ registry ],
});
const storedERC721TokenCounter = new client.Counter({
  name: 'stored_erc721_token_counter',
  help: 'stored erc721 token counter',
  registers: [ registry ],
});
const storedERC1155TokenCounter = new client.Counter({
  name: 'stored_erc1155_token_counter',
  help: 'stored erc1155 token counter',
  registers: [ registry ],
});
const storedContractCounter = new client.Counter({
  name: 'stored_contract_counter',
  help: 'stored contract counter',
  registers: [ registry ],
});
const wgTasksGauge = new client.Gauge({
  name: 'tasks_gauge',
  help: 'tasks gauge',
  registers: [ registry ],
});
const storeTokenGauge = new client.Gauge({
  name: 'store_token_gauge',
  help: 'store token gauge',
  registers: [ registry ],
});
const storeContractGauge = new client.Gauge({
  name: 'store_contract_gauge',
  help: 'store contract gauge',
  registers: [ registry ],
});
const tokensGauge = new client.Gauge({
  name: 'tokens_gauge',
  help: 'tokens gauge',
  registers: [ registry ],
});
const duplicateERC721Counter = new client.Counter({
  name: 'duplicate_erc721_token_counter',
  help: 'duplicate erc721 token counter',
  registers: [ registry ],
});
const duplicateERC1155Counter = new client.Counter({
  name: 'duplicate_erc1155_token_counter',
  help: 'duplicate erc1155 token counter',
  registers: [ registry ],
});

/**
 * Token Processor Provider (Injectable class)
 */
@Injectable()
export class TokenProcessorProvider implements OnApplicationShutdown {
  private contracts: Map<string, never>;
  private serviceConfig: IServiceConfig;

  constructor(
    private readonly web3Provider: Web3Provider<IIndexerConfig>,
    @Inject(MESSAGE_BUS_PROVIDER) private messageBusClient: ClientProxy,
    private readonly contractsDB: ContractsRepo,
    private readonly tokens: TokensRepo,
    private readonly configService: ConfigService<IIndexerConfig>,
  ) {
    this.contracts = new Map<string, never>();
    this.serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
  }

  /**
   * Asynchronously process tokens within block range
   * @param {number} firstBlockFrom first block of range
   * @param {number} lastBlockTo last block of range
   * @returns {boolean} status of processing
   */
  public async process(firstBlockFrom: number, lastBlockTo: number, events: WithId<Event>[]): Promise<boolean> {
    const foundTokens = new Map<string, never>();
    const wg = WaitGroup.withGauge(this.serviceConfig.workersCount, wgTasksGauge);
    let tokenCount = 0;

    for (const event of events) {
      eventCounter.inc(1);
      if (event.type === TokenStandard.ERC721) {
        erc721EventCounter.inc(1);
      } else if(event.type === TokenStandard.ERC1155) {
        erc1155EventCounter.inc(1);
      }

      const contract = getContractInstance(event.contractAddress, this.web3Provider.provider);

      if (!this.contracts.has(contract.address)) {
        this.contracts.set(contract.address, {} as never);
        contractCounter.inc(1);
        if (event.type === TokenStandard.ERC721) {
          erc721ContractCounter.inc(1);
        } else if(event.type === TokenStandard.ERC1155) {
          erc1155ContractCounter.inc(1);
        }

        await wg.go(async () => {

          const end = storeContractGauge.startTimer();
          try {
            await this.contractsDB.insertIfNone({
              blockchain: this.serviceConfig.chainName,
              address: contract.address,
              type: event.type,
              name: '',
              block: event.blockNumber,
              createdAt: new Date(),
            });

            storedContractCounter.inc(1);
          } catch (e) {
            logger.error({
              msg: 'Error storing contract into DB',
              from: firstBlockFrom, to: lastBlockTo,
              contract: contract.address,
              error: e,
            });

            return;
          } finally {
            end();
          }

          try {
            const contractEvent: ContractEventData = {
              blockchainName: this.serviceConfig.chainName,
              blockNumber: event.blockNumber,
              contractAddress: contract.address,
              contractType: event.type,
            };

            await lastValueFrom(this.messageBusClient.emit(ServiceEvents.READ_CONTRACT, contractEvent));
          } catch (error) {
            logger.error({
              msg: 'Error sending message to queue with event',
              eventName: ServiceEvents.READ_CONTRACT,
              from: firstBlockFrom, to: lastBlockTo,
              contract: contract.address,
              error: error,
            });
          }
        });
      }

      for (const id of event.ids) {
        tokenCount++;
        if (event.type === TokenStandard.ERC721) {
          erc721TokenCounter.inc(1);
        } else if(event.type === TokenStandard.ERC1155) {
          erc1155TokenCounter.inc(1);
        }

        if (
          foundTokens.has(`${this.serviceConfig.chainName}:${contract.address}:${id}`)
        ) {
          logger.debug({
            msg: 'Skip token',
            token: `${this.serviceConfig.chainName}:${contract.address}:${id}`,
            from: firstBlockFrom, to: lastBlockTo,
          });

          continue;
        }

        foundTokens.set(`${this.serviceConfig.chainName}:${contract.address}:${id}`, {} as never);

        await wg.go(async () => {
          let saveResult;
          let emitEvent = true;

          const end2 = storeTokenGauge.startTimer();
          try {
            saveResult = await this.tokens.upsert({
              blockchain: this.serviceConfig.chainName,
              contractAddress: contract.address,
              tokenId: id,
              tokenUri: '',
              from: event.from,
              count: 1,
              block: event.blockNumber,
              createdAt: new Date(),
            });

            emitEvent = saveResult.upsertedCount === 1;

            if (event.type === TokenStandard.ERC721) {
              storedERC721TokenCounter.inc(1);
            } else if(event.type === TokenStandard.ERC1155) {
              storedERC1155TokenCounter.inc(1);
            }
          } catch (e) {
            if (e instanceof MongoServerError && e.code === MONGO_SERVER_DUPLICATE_KEY_ERROR_CODE) {
              if (event.type === TokenStandard.ERC721) {
                duplicateERC721Counter.inc(1);
              } else if(event.type === TokenStandard.ERC1155) {
                duplicateERC1155Counter.inc(1);
              }
            }
            logger.error({
              msg: 'Error storing token into DB',
              token: `${this.serviceConfig.chainName}:${contract.address}:${id}`,
              from: firstBlockFrom, to: lastBlockTo, eventType: event.type, error: e,
            });

            return;
          } finally {
            end2();
          }

          try {
            const tokenEvent: TokenEventData = {
              blockchainName: this.serviceConfig.chainName,
              blockNumber: event.blockNumber,
              contractAddress: contract.address,
              contractType: event.type,
              tokenId: id,
            };

            if(emitEvent) {
              await lastValueFrom(this.messageBusClient.emit(ServiceEvents.READ_TOKEN, tokenEvent));
            }
          } catch (error) {
            logger.error({
              msg: 'error sending message to queue with event',
              eventName: ServiceEvents.READ_TOKEN,
              from: firstBlockFrom, to: lastBlockTo,
              contract: contract.address,
            });
          }
        });
      }
    }
    await wg.wait();

    logger.info({ from: firstBlockFrom, to: lastBlockTo, msg: 'Finished block range processing' });
    tokensGauge.set(tokenCount);
    blockCounter.inc(lastBlockTo - firstBlockFrom + 1);

    return true;
  }

  async onApplicationShutdown() {
    await this.messageBusClient.close();
  }
}

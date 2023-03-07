import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Blockchain } from '@shared/blockchain';
import { ContractsRepo } from '@shared/contracts';
import { registry } from '@shared/index';
import { logger } from '@shared/logger';
import { ContractEventData, MESSAGE_BUS_PROVIDER, MetadataEventData, ServiceEvents, TokenEventData } from '@shared/microservices';
import { getContractInstance } from '@shared/nfts';
import { IOpenseaConfig, OpenseaClient } from '@shared/opensea';
import { CONTRACT_OBJECTS, ContractFeature, ContractObject } from '@shared/pre-721';
import { TokenStandard, TokensRepo } from '@shared/tokens';
import { Web3Provider } from '@shared/web3';
import { WaitGroup } from '@shared/wg';
import { ethers } from 'ethers';
import client from 'prom-client';
import { lastValueFrom } from 'rxjs';
import { IContractReaderConfig, IServiceConfig } from '../app.config';

const wgTasksGauge = new client.Gauge({
  name: 'tasks_gauge',
  help: 'tasks gauge',
  registers: [ registry ],
});
const fetchContractNameGauge = new client.Gauge({
  name: 'fetch_contract_name_gauge',
  help: 'fetch contract name gauge',
  registers: [ registry ],
});
const fetchCollectionImageGauge = new client.Gauge({
  name: 'fetch_collection_image_gauge',
  help: 'fetch collection image gauge',
  registers: [ registry ],
});
const updateContractGauge = new client.Gauge({
  name: 'update_contract_gauge',
  help: 'update contract gauge',
  registers: [ registry ],
});
const updateContractCounter = new client.Counter({
  name: 'update_contract_counter',
  help: 'update contract counter',
  registers: [ registry ],
});
const fetchURIGauge = new client.Gauge({
  name: 'fetch_uri_gauge',
  help: 'fetch uri gauge',
  registers: [ registry ],
});
const updateTokenGauge = new client.Gauge({
  name: 'update_token_gauge',
  help: 'update token gauge',
  registers: [ registry ],
});
const updateERC721TokenCounter = new client.Counter({
  name: 'update_erc721_token_counter',
  help: 'update erc721 token counter',
  registers: [ registry ],
});
const updateERC1155TokenCounter = new client.Counter({
  name: 'update_erc1155_token_counter',
  help: 'update erc1155 token counter',
  registers: [ registry ],
});

/**
 * Contract Reader Service
 * Service used by contract reader controller and responsible for updating contract name and token uri
 */
@Injectable()
export class ContractReaderService implements OnApplicationShutdown {
  private wg: WaitGroup;
  private pre721ContractsEnabled: boolean;
  private readonly openseaClient: OpenseaClient;

  constructor(
    private readonly web3Provider: Web3Provider<IContractReaderConfig>,
    @Inject(MESSAGE_BUS_PROVIDER) private messageBusClient: ClientProxy,
    private readonly contracts: ContractsRepo,
    private readonly tokens: TokensRepo,
    private readonly configService: ConfigService<IContractReaderConfig>,
  ) {
    const serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
    const openseaConfig = this.configService.get<IOpenseaConfig>('opensea') as IOpenseaConfig;

    this.wg = WaitGroup.withGauge(serviceConfig.workersCount, wgTasksGauge);
    this.pre721ContractsEnabled = serviceConfig.pre721ContractsEnabled;
    this.openseaClient = new OpenseaClient(openseaConfig);
  }

  /**
   * Asynchronously fetching contract instance name and update it in contracts collection
   *
   * @param {ContractEventData} contractData contract event data
   *
   * @returns {Promise<number>} fetch contract name count
   */
  async processContract(contractData: ContractEventData): Promise<number> {
    let fetchedContractNameCount = 0;

    const { blockchainName, blockNumber, contractAddress } = contractData;
    const contractId = `${blockchainName}:${contractAddress}`;

    let contractObject: ContractObject | undefined;
    if (this.pre721ContractsEnabled) {
      contractObject = CONTRACT_OBJECTS.find(
        (element) => element.address === contractAddress,
      );
    }

    const contractInstance = getContractInstance(contractAddress, this.web3Provider.provider);

    await this.wg.go(async () => {
      const [ contractName,  collectionImageUrl   ] = await Promise.all([
        this.fetchContractName(contractData, contractObject, contractInstance, contractId),
        this.fetchCollectionImage(contractData, contractId),
      ]);

      if (!contractName) {
        return;
      }

      fetchedContractNameCount++;

      const end = updateContractGauge.startTimer();
      try {
        await this.contracts.update(contractId, {
          name: contractName,
          collectionImage: {
            url: collectionImageUrl,
            updatedAt: new Date(),
          },
        });
        updateContractCounter.inc(1);
      } catch (e) {
        logger.error({
          msg: 'Error updating contract name and collection image in DB',
          contract: contractId,
          name: contractName,
          collectionImage: collectionImageUrl,
          block: blockNumber,
          error: e,
        });
      } finally {
        end();
      }
    });

    return fetchedContractNameCount;
  }

  /**
   * Asynchronously process token uri by token id and update it in tokens collection
   *
   * @param {TokenEventData} tokenData token event data
   *
   * @returns {Promise<void>}
   */
  async processToken(tokenData: TokenEventData): Promise<void> {
    const { blockchainName, blockNumber, contractAddress, contractType, tokenId } = tokenData;
    const contractInstance = getContractInstance(contractAddress, this.web3Provider.provider);
    const token = `${blockchainName}:${contractAddress}:${tokenId}`;

    let contractFeature: ContractFeature | undefined;
    if (this.pre721ContractsEnabled) {
      contractFeature = CONTRACT_OBJECTS.find(
        (element) => element.address === contractAddress,
      )?.features;
    }

    const api = contractFeature?.api;
    const tokenMetadata = contractFeature?.tokenMetadata;

    await this.wg.go(async () => {
      let uri = '';

      let end = fetchURIGauge.startTimer();
      try {
        // On purpose ignoring contract interface check for now
        // to test indexer with all fetched events and tokens.
        if (api) {
          uri = api + BigInt(tokenId).toString();
        } else if (tokenMetadata) {
          uri = await contractInstance.tokenMetadata(tokenId);
        } else if (contractType === TokenStandard.ERC721 || contractType === TokenStandard.PRE721) {
          uri = await contractInstance.tokenURI(tokenId);
        } else if (contractType === TokenStandard.ERC1155 || contractType === TokenStandard.PRE1151) {
          uri = await contractInstance.uri(tokenId);
        }
      } catch (e) {
        logger.error({
          msg: 'Error getting token URI',
          token,
          block: blockNumber,
          error: e,
        });

        return;
      } finally {
        end();
      }

      if (uri === '') {
        return;
      }
      end = updateTokenGauge.startTimer();
      try {
        await this.tokens.updateUri(token, uri);

        if (contractType === TokenStandard.ERC721) {
          updateERC721TokenCounter.inc(1);
        } else if (contractType === TokenStandard.ERC1155) {
          updateERC1155TokenCounter.inc(1);
        }
      } catch (e) {
        logger.error({
          msg: 'Error updating token into DB',
          token,
          type: contractType,
          block: blockNumber,
          error: e,
        });

        return;
      } finally {
        end();
      }

      const metadataEvent: MetadataEventData = {
        blockchainName: blockchainName as Blockchain,
        blockNumber,
        contractAddress,
        contractType,
        tokenId,
        tokenUri: uri,
      };
      try {
        await lastValueFrom(this.messageBusClient.emit(ServiceEvents.READ_METADATA, metadataEvent));
      } catch (error) {
        logger.error({
          msg: 'Error sending message to queue with event',
          eventName: ServiceEvents.READ_METADATA,
          eventData: metadataEvent,
        });
      }
    });
  }

  async onApplicationShutdown() {
    await this.messageBusClient.close();
  }

  private async fetchContractName(contractData: ContractEventData,
    contractObject: ContractObject | undefined,
    contractInstance: ethers.Contract,
    contractId: string): Promise<string | undefined> {
    const end = fetchContractNameGauge.startTimer();
    try {
      if (contractObject?.name) {
        return contractObject.name;
      } else {
        return await contractInstance.name();
      }
    } catch (e) {
      logger.error({
        msg: 'Error fetching contract name',
        contract: contractId,
        block: contractData.blockNumber,
        error: e,
      });

      return;
    } finally {
      end();
    }
  }

  private async fetchCollectionImage(contractData: ContractEventData, contractId: string) {
    const end = fetchCollectionImageGauge.startTimer();
    try {
      return await this.openseaClient.getOpenseaCollectionImageUrl(contractData.contractAddress);
    } catch (e) {
      logger.error({
        msg: 'Error fetching collection image',
        contract: contractId,
        block: contractData.blockNumber,
        error: e,
      });

      return;
    } finally {
      end();
    }
  }
}

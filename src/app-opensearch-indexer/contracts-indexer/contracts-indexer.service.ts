import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '@shared/logger';
import { ContractMappings, ContractsRepo, IContractIndex, mapToSearchContractIndex } from '@shared/contracts';
import { IOpensearchConfig, OpensearchProvider } from '@shared/opensearch';
import { TokensRepo } from '@shared/tokens';
import { IOpensearchIndexerConfig, IServiceConfig } from '../app.config';

@Injectable()
export class ContractsIndexerService {
  private serviceConfig: IServiceConfig;
  private opensearchConfig: IOpensearchConfig;

  constructor(
    private readonly tokens: TokensRepo,
    private readonly contracts: ContractsRepo,
    private readonly configService: ConfigService<IOpensearchIndexerConfig>,
    private readonly opensearchProvider: OpensearchProvider<IOpensearchIndexerConfig>,
  ) {
    this.serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
    this.opensearchConfig = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
  }

  private async cleanIndex(): Promise<void> {
    try {
      await this.opensearchProvider.removeIndex(this.opensearchConfig.indexNameContracts);
    } finally {
      await this.opensearchProvider.initIndex(this.opensearchConfig.indexNameContracts, ContractMappings);
    }
  }

  private async process(): Promise<void> {
    let processedItemsCount = 0;
    let nextFromId = '';
    let processing = true;
    const limit = this.serviceConfig.countOnPage;

    while (processing) {
      logger.info(`Process ${JSON.stringify({ nextFromId, limit })}`);
      const contractsList = await this.contracts.getContractsList(limit, nextFromId);

      logger.info(`Count contracts ${contractsList.length}`);
      if (contractsList.length === 0) {
        logger.info('No contracts for process');

        processing = false;
        continue;
      }

      const bulkOperationData: (Record<string, { _index: string; _id: string }> | Partial<IContractIndex>)[] = [];
      nextFromId = contractsList[contractsList.length - 1]._id;

      const tokensCountByPrefixes = await Promise.all(contractsList.map(async (contract) => {
        const tokensCount = await this.tokens.getCountByIdPrefix(contract._id);

        return {
          _id: contract._id,
          count: tokensCount,
        };
      }));

      const tokensCountObject: Record<string, number> = tokensCountByPrefixes.reduce<Record<string, number>>((acc, curr) => ({
        ...acc,
        [curr._id]: curr.count,
      }), {});

      for (let i = 0; i < contractsList.length; i++) {
        const contract = contractsList[i];
        const indexData = mapToSearchContractIndex(contract, tokensCountObject[contract._id] ?? 0);

        if (!indexData) {
          continue;
        }

        const { id, ...data } = indexData;

        bulkOperationData.push({ create: { _index: this.opensearchConfig.indexNameContracts, _id: id as string } });
        bulkOperationData.push(data);
      }

      processedItemsCount += contractsList.length;

      const result = await this.opensearchProvider.bulkOperation(this.opensearchConfig.indexNameContracts, bulkOperationData);

      const { took, errors } = result.body as Record<string, any>;

      logger.info(`Bulk operation result ${JSON.stringify({ took, errors })}`);
    }

    logger.info(`Contracts processing finished. Procssed ${processedItemsCount} items`);
  }

  public async run(): Promise<void> {
    await this.cleanIndex();
    await this.process();
  }
}

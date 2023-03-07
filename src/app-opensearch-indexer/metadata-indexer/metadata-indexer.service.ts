import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as retry from 'retry';
import { logger } from '@shared/logger';
import {
  IMetadataIndex,
  METADATA_REPO_PROVIDER,
  MetadataMappings,
  MetadataRepoDB,
  mapToSearchIndex,
} from '@shared/metadata';
import { IOpensearchIndexerConfig, IServiceConfig } from '../app.config';
import { IOpensearchConfig, OpensearchProvider } from '@shared/opensearch';

type BulkOperationData = (Record<string, { _index: string; _id: string }> | Partial<IMetadataIndex>)[];
@Injectable()
export class MetadataIndexerService {
  private serviceConfig: IServiceConfig;
  private opensearchConfig: IOpensearchConfig;
  private ac: AbortController;

  constructor(
    @Inject(METADATA_REPO_PROVIDER) private readonly metadata: MetadataRepoDB,
    private readonly configService: ConfigService<IOpensearchIndexerConfig>,
    private readonly opensearchProvider: OpensearchProvider<IOpensearchIndexerConfig>,
  ) {
    this.serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
    this.opensearchConfig = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
    this.ac = new AbortController();
  }

  private async cleanIndex(): Promise<void> {
    try {
      await this.opensearchProvider.removeIndex(this.opensearchConfig.indexNameMetadata);
    } catch (e) {
      logger.error(`Opensearch index remove: ${e}`);
    } finally {
      await this.opensearchProvider.initIndex(this.opensearchConfig.indexNameMetadata, MetadataMappings);
    }
  }

  private async bulkWithRetry(bulkOperationData: BulkOperationData, retries: number, delay: number): Promise<void> {
    const operation = retry.operation({
      retries,
      minTimeout: delay,
      maxTimeout: delay,
    });

    return new Promise((resolve, reject) => {
      operation.attempt(async (currentAttempt: number) => {
        try {
          const result = await this.opensearchProvider.bulkOperation(this.opensearchConfig.indexNameMetadata, bulkOperationData);
          const { took, errors } = result.body as Record<string, any>;

          if (errors) {
            throw new Error(`Bulk operation result ${JSON.stringify({ took, errors })}`);
          }

          resolve();
        } catch (e) {
          if (operation.retry(e as unknown as Error)) {
            logger.error({
              msg: `Error bulk upsert metadata to index (Attempt #${currentAttempt}): ${(e as Error).message}. Retrying...`,
            });

            return;
          }

          reject(operation.mainError());
        }
      });
    });
  }

  private async process(): Promise<void> {
    let processedItemsCount = 0;
    let indexedItemsCount = 0;
    let nextFromId = '';
    let processing = true;
    const limit = this.serviceConfig.countOnPage;
    let failedMetadataIds: string[] = [];

    const timeLabel = 'Index metadata';
    console.time(timeLabel);
    while (processing) {
      const timeLabel = `Process ${JSON.stringify({ nextFromId, limit })}`;
      console.time(timeLabel);
      const metadataList = await this.metadata.getMetadataList(limit, nextFromId);

      if (metadataList.length === 0) {
        logger.info('No metadata for process');

        processing = false;
        continue;
      }

      const bulkOperationData: BulkOperationData = [];
      nextFromId = metadataList[metadataList.length - 1]._id;

      let itemsToIndex = 0;
      for (let i = 0; i < metadataList.length; i++) {
        const indexData = mapToSearchIndex(metadataList[i]);

        if (!indexData) {
          continue;
        }

        const { id, ...data } = indexData;

        bulkOperationData.push({ create: { _index: this.opensearchConfig.indexNameMetadata, _id: id as string } });
        bulkOperationData.push(data);
        itemsToIndex++;
      }

      processedItemsCount += metadataList.length;

      if (!bulkOperationData.length) {
        logger.info('nothing to index, skip this step');
        console.timeEnd(`Process ${JSON.stringify({ nextFromId, limit })}`);
        continue;
      }

      try {
        await this.bulkWithRetry(bulkOperationData, 5, 1000);

        indexedItemsCount += itemsToIndex;
      } catch (e) {
        logger.info(`Bulk operation failed with message ${(e as Error).message}`);
        failedMetadataIds = failedMetadataIds.concat(metadataList.map(metadata => metadata._id));
      }
      console.timeEnd(timeLabel);
    }

    console.timeEnd(timeLabel);
    logger.info(`Metadata processing finished. Processed ${processedItemsCount} items, indexed ${indexedItemsCount} items`);
    if (failedMetadataIds.length) {
      logger.info(`Failed metadata ids: ${JSON.stringify(failedMetadataIds, null, 2)}`);
    }
  }

  public async run(): Promise<void> {
    await this.cleanIndex();
    await this.process();
  }
}

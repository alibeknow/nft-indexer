import { setTimeout } from 'timers/promises';
import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DBModule } from '@shared/db';
import { logger } from '@shared/logger';
import { getLatestBlock } from '@shared/ethnode';
import { EventIndexType, EventsReaderStateLogRepo, EventsRepo } from '@shared/events';
import { BlocksQueueRepo } from '@shared/blocks-queue';
import { MESSAGE_BUS_PROVIDER, clientFactory } from '@shared/microservices';
import { Web3Provider } from '@shared/web3';
import { IEventsReaderConfig, IServiceConfig } from '../app.config';
import { EventsReaderController } from './events-reader.controller';
import { EventsReaderService } from './events-reader.service';
import { ReaderTasksProvider } from './reader-tasks.provider';

@Module({
  imports: [ DBModule ],
  controllers: [ EventsReaderController ],
  providers: [
    {
      provide: MESSAGE_BUS_PROVIDER,
      useFactory: (configService: ConfigService<IEventsReaderConfig>) => clientFactory(configService, 'blocksQueue'),
      inject: [ ConfigService<IEventsReaderConfig> ],
    },
    ReaderTasksProvider,
    EventsRepo,
    EventsReaderStateLogRepo,
    BlocksQueueRepo,
    EventsReaderService,
    Web3Provider<IEventsReaderConfig>,
  ],
  exports: [ EventsReaderService, BlocksQueueRepo, EventsRepo ],
})
export class EventsReaderModule implements OnModuleInit, OnModuleDestroy {
  private loopAbortController: AbortController;

  constructor(
    private readonly configService: ConfigService<IEventsReaderConfig>,
    private readonly readerTasksProvider: ReaderTasksProvider,
    private readonly readerService: EventsReaderService,
    private readonly web3Provider: Web3Provider<IEventsReaderConfig>,
    private readonly blockRepo: BlocksQueueRepo,
    private readonly eventRepo: EventsRepo,
  ) {
    this.loopAbortController = new AbortController();
  }

  async runLoop(): Promise<void> {
    for (;;) {
      if (this.loopAbortController.signal.aborted) {
        break;
      }

      const activeReaderTask = await this.readerTasksProvider.getActiveReaderTask();

      if (!activeReaderTask) {
        await setTimeout(500, null, { signal: this.loopAbortController.signal });
        continue;
      }

      const { blockNumberFrom, blockNumberTo, type } = activeReaderTask;

      if (blockNumberTo) {
        await this.blockRangeProcessing(blockNumberFrom, blockNumberTo, type === EventIndexType.REINDEX);
        continue;
      }

      await this.liveProcessing(blockNumberFrom);
    }
  }

  private async blockRangeProcessing(blockFrom: number | null, blockTo: number, rewrite: boolean): Promise<void> {
    const serviceConfig: IServiceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;

    const processingLimit = serviceConfig.processingLimit;
    let to = 0;
    let from = blockFrom || 0;

    if (!rewrite) {
      const latestBlockFromDb = await this.blockRepo.getLatest(blockTo);
      if (latestBlockFromDb) {
        from = latestBlockFromDb.to + 1;

        await this.eventRepo.deleteWhereBlockNumberGreaterThan(latestBlockFromDb.to);
      }
    }

    const taskAbortController = this.readerTasksProvider.abortController as AbortController;

    for (;;) {
      if (taskAbortController.signal.aborted) {
        logger.info('Task interrupted by abort controller');
        break;
      }

      if(to === blockTo) {
        logger.info(`Pulling blocks from ${blockFrom} to ${blockTo} is finished`);
        break;
      }

      to = from + processingLimit > blockTo ? blockTo : from + processingLimit;

      logger.info(`Pulling blocks from ${from} to ${to}`);

      await this.readerService.read({ blockNumberFrom: from, blockNumberTo: to }, false, rewrite);

      from = to + 1;
    }

    if (!taskAbortController.signal.aborted) {
      await this.readerTasksProvider.stopReaderTask();
    }
  }

  private async liveProcessing(blockFrom: number | null): Promise<void> {
    const serviceConfig: IServiceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;

    const processingLimit = serviceConfig.processingLimit;
    const checkInterval = serviceConfig.checkInterval;

    let blockTo = await getLatestBlock(this.web3Provider.provider);
    const latestBlockFromDb = await this.blockRepo.getLatest(blockTo);

    let to = 0;
    let from = blockFrom || 0;

    if (latestBlockFromDb) {
      from = latestBlockFromDb.to + 1;

      await this.eventRepo.deleteWhereBlockNumberGreaterThan(latestBlockFromDb.to);
    }

    const taskAbortController = this.readerTasksProvider.abortController as AbortController;

    for (;;) {
      if (taskAbortController.signal.aborted) {
        logger.info('Task interrupted by abort controller');
        break;
      }

      blockTo = await getLatestBlock(this.web3Provider.provider);

      if(to === blockTo) {
        logger.info(`Waiting for new blocks... Last processed block: ${to}`);
        await setTimeout(checkInterval * 1000, null, { signal: taskAbortController.signal });
        continue;
      }

      to = from + processingLimit > blockTo ? blockTo : from + processingLimit;

      logger.info(`Pulling blocks from ${from} to ${to}`);

      await this.readerService.read({ blockNumberFrom: from, blockNumberTo: to }, true);

      from = to + 1;
    }
  }

  onModuleInit(): void {
    logger.info('Module init, running loop');
    this.runLoop();
  }

  onModuleDestroy(): void {
    const taskAbortController = this.readerTasksProvider.abortController as AbortController;

    if (taskAbortController) {
      taskAbortController.abort();
    }

    this.loopAbortController.abort();
  }
}

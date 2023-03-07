import { TokenProcessorModule, TokenProcessorProvider } from '@app-indexer/token-processor';
import { EventsRepo } from '@shared/events';
import { LazyMintBlocksQueueRepo } from '@shared/lazy-mint-blocks-queue';
import { logger } from '@shared/logger';
import { MetricsController } from '@shared/metrics';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StatusController } from '@shared/status';
import { Web3Provider } from '@shared/web3';
import { ILazyMintIndexerConfig, getLazyMintIndexerConfig } from './app.config';
import { EventsReaderModule, EventsReaderService } from './events-reader';

export interface InputParams {
  limit: number;
  blockNumberFrom: number;
  blockNumberTo: number;
}

@Module({
  controllers: [ MetricsController, StatusController ],
  imports: [
    ConfigModule.forRoot({
      load: [ getLazyMintIndexerConfig ],
      isGlobal: true,
    }),
    EventsReaderModule,
    TokenProcessorModule,
  ],
  providers: [
    Web3Provider<ILazyMintIndexerConfig>,
  ],
})
export class AppModule {

  constructor(
    private readonly web3Provider: Web3Provider<ILazyMintIndexerConfig>,
    private readonly eventsRepo: EventsRepo,
    private readonly readerService: EventsReaderService,
    private readonly tokenProcessorProvider: TokenProcessorProvider,
    private readonly lazyMintBlockRepo: LazyMintBlocksQueueRepo,
  ) {}

  async runLoop(input: InputParams): Promise<void> {
    logger.info(`Started to pull events for blocks from ${input.blockNumberFrom} to ${input.blockNumberTo}`);

    let from = input.blockNumberFrom;
    const to = input.blockNumberTo;
    const actualLimit = input.limit - 1;

    const latestBlock: number = to;
    const latestBlockFromDb = await this.lazyMintBlockRepo.getLatest(latestBlock);

    if (latestBlockFromDb) {
      const blockFrom = latestBlockFromDb.to + 1;
      const blockTo = blockFrom + actualLimit;

      await this.eventsRepo.deleteByBlockRange(blockFrom, blockTo);
      from = latestBlockFromDb.to + 1;
    }

    for (let i = from; i <= to; i += actualLimit + 1) {
      logger.info(`Fetching events for block range: ${i} - ${i + actualLimit}...`);
      const curFrom = i;
      let curTo = i + actualLimit;

      if(curTo > to) {
        curTo = to;
      }

      const events = await this.readerService.read({ blockNumberFrom: curFrom, blockNumberTo: curTo });

      logger.info({ from: curFrom, to: curTo, msg: 'Started processing events for block range' });
      logger.info({ from: curFrom, to: curTo, msg: `Events count ${events.length} for block range` });

      await this.tokenProcessorProvider.process(from, to, events);
    }
  }
}

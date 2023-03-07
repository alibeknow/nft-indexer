import { DBModule } from '@shared/db';
import { Module } from '@nestjs/common';
import { EventsRepo } from '@shared/events';
import { LazyMintBlocksQueueRepo } from '@shared/lazy-mint-blocks-queue';
import { Web3Provider } from '@shared/web3';
import { ILazyMintIndexerConfig } from '../app.config';
import { EventsReaderService } from './events-reader.service';

@Module({
  imports: [ DBModule ],
  providers: [
    EventsRepo,
    LazyMintBlocksQueueRepo,
    EventsReaderService,
    Web3Provider<ILazyMintIndexerConfig>,
  ],
  exports: [ EventsReaderService, LazyMintBlocksQueueRepo, EventsRepo ],
})
export class EventsReaderModule {}

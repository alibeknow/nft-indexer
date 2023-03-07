import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// TODO Replace deprecated DB provider to DBProvider
import { DB } from '@shared/db';
import { logger } from '@shared/logger';

@Module({
  // TODO Replace deprecated DB provider to DBProvider
  providers: [ DB ],
  exports: [ DB ],
  imports: [],
})
export class DBModule implements OnModuleDestroy, OnModuleInit {
  constructor(
    private readonly db: DB,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.db.open();
    await this.db.eventsIndexes();
    await this.db.eventsReaderStateLogIndexes();
    await this.db.createTokensIndexes();
    await this.db.createBlockQueueIndexes();
    await this.db.createLazyMintBlockQueueIndexes();
    logger.info('DB connection is opened');
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.close(true);
    logger.info('DB connection is closed');
  }
}

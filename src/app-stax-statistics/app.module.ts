import { logger } from '@shared/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Cron, ScheduleModule } from '@nestjs/schedule';
import { getStaxStatisticsConfig } from './app.config';
import { StaxMetadataModule } from './stax-metadata';
import { StaxMetadataService } from './stax-metadata/stax-metadata.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ getStaxStatisticsConfig ],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    StaxMetadataModule,
  ],
})
export class AppModule {
  constructor(private readonly staxMetadataService: StaxMetadataService) {}

  /**
   * Cron('0 0 8 * * *'):
   * Cron starts script processing of Stax Metadata statistics every day at 8am.
   */
  @Cron('0 0 8 * * *')
  async run() {
    logger.info('Start conversion data from OpenSearch document to CSV');
    await this.staxMetadataService.run();
  }
}

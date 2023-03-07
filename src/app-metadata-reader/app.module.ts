import client from 'prom-client';
import { setTimeout } from 'timers/promises';
import { Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController, registry } from '@shared/metrics';
import { OpensearchModule } from '@shared/opensearch';
import { StatusController } from '@shared/status';
import { MetadataReaderModule, MetadataReaderService } from './metadata-reader';
import { getMetadataReaderConfig } from './app.config';

const processedMetadataGauge = new client.Gauge({
  name: 'processed_metadata_gauge',
  help: 'processed metadata gauge',
  registers: [ registry ],
});

@Module({
  controllers: [ MetricsController, StatusController ],
  imports: [
    ConfigModule.forRoot({
      load: [ getMetadataReaderConfig ],
      isGlobal: true,
    }),
    MetadataReaderModule,
    OpensearchModule,
  ],
})
export class AppModule implements OnModuleDestroy {
  private ac: AbortController;

  constructor(
    private readonly metadataReaderService: MetadataReaderService,
  ) {
    this.ac = new AbortController();
  }

  /**
   * Main loop that processes unchecked tokens from the database
   * @param {number} batchLimit Maximum number of tokens retrieved from DB at once
   * @param {number} workers Number of async workers to process tokens metadata
   * @param {number} checkInterval Interval of checking DB in seconds
   */
  async runLoop(batchLimit: number, workers: number, checkInterval: number): Promise<void> {
    for (;;) {
      if (this.ac.signal.aborted) {
        break;
      }

      let tokensCount = 0;

      const end = processedMetadataGauge.startTimer();
      try {
        tokensCount = await this.metadataReaderService.read(batchLimit, workers);
      } finally {
        end();
      }

      if (tokensCount === 0) {
        await setTimeout(checkInterval * 1000, null, { signal: this.ac.signal });
      }
    }
  }

  onModuleDestroy(): void {
    this.ac.abort();
  }
}

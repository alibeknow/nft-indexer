import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from '@shared/metrics';
import { StatusController } from '@shared/status';
import { getOpensearchIndexerConfig } from './app.config';
import { MetadataIndexerModule, MetadataIndexerService } from './metadata-indexer';
import { ContractsIndexerModule, ContractsIndexerService } from './contracts-indexer';

@Module({
  controllers: [ MetricsController, StatusController ],
  imports: [
    ConfigModule.forRoot({
      load: [ getOpensearchIndexerConfig ],
      isGlobal: true,
    }),
    ContractsIndexerModule,
    MetadataIndexerModule,
  ],
  providers: [],
})
export class AppModule {
  constructor(
    private readonly metadataIndexerService: MetadataIndexerService,
    private readonly contractsIndexerService: ContractsIndexerService,
  ) {
  }

  /**
   * Main method that processes all metadata from the database and put to opensearch index
   */
  async runMetadataIndex(): Promise<void> {
    await this.metadataIndexerService.run();
  }

  /**
   * Method that processes all contracts from the database and put to opensearch index
   */
  async runContractsIndex(): Promise<void> {
    await this.contractsIndexerService.run();
  }
}

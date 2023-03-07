import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Provider } from '@shared/aws';
import { ContractMappings, ContractsRepo } from '@shared/contracts';
import { DB, DBModule } from '@shared/db';
import { IMetadataRepo, METADATA_REPO_PROVIDER, MetadataMappings, MetadataRepoDB, MetadataRepoStorage, MetadataRepoType } from '@shared/metadata';
import { IOpensearchConfig, OpensearchModule, OpensearchProvider } from '@shared/opensearch';
import { TokensRepo } from '@shared/tokens';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { IApiConfig, IServiceConfig } from '../app.config';

@Module({
  imports: [ DBModule, OpensearchModule ],
  controllers: [ SearchController ],
  providers: [
    SearchService,
    S3Provider,
    ContractsRepo,
    TokensRepo,
    {
      provide: METADATA_REPO_PROVIDER,
      inject: [ S3Provider, DB, ConfigService<IApiConfig> ],
      useFactory: (s3Provider: S3Provider<IApiConfig>, db: DB, configService: ConfigService<IApiConfig>): IMetadataRepo => {
        const serviceConfig = configService.get<IServiceConfig>('service') as IServiceConfig;
        const metadataRepoProviderType = serviceConfig.repoProvider;
        const awsS3Bucket = serviceConfig.awsBucket;

        switch (metadataRepoProviderType) {
        case MetadataRepoType.S3:
          return new MetadataRepoStorage(s3Provider, awsS3Bucket!);
        case MetadataRepoType.MONGO:
          return new MetadataRepoDB(db);
        default:
          throw new Error('Unknown MetadataRepo provider');
        }
      },
    },
  ],
})
export class SearchModule implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<IApiConfig>,
    private readonly opensearchProvider: OpensearchProvider<IApiConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    const opensearchConfig = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
    await this.opensearchProvider.initIndex(opensearchConfig.indexNameMetadata, MetadataMappings);
    await this.opensearchProvider.initIndex(opensearchConfig.indexNameContracts, ContractMappings);
  }
}

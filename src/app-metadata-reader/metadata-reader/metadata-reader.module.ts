import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DB, DBModule } from '@shared/db';
import { IMetadataRepo, METADATA_REPO_PROVIDER, MetadataRepoDB, MetadataRepoStorage, MetadataRepoType } from '@shared/metadata';
import { ContractsRepo } from '@shared/contracts';
import { TokensRepo } from '@shared/tokens';
import { MetadataReaderService } from './metadata-reader.service';
import { MetadataReaderController } from './metadata-reader.controller';
import { S3Provider } from '@shared/aws';
import { IMetadataReaderConfig, IServiceConfig } from '../app.config';

@Module({
  controllers: [ MetadataReaderController ],
  providers: [
    {
      provide: METADATA_REPO_PROVIDER,
      inject: [ S3Provider, DB, ConfigService<IMetadataReaderConfig> ],
      useFactory: (s3Provider: S3Provider<IMetadataReaderConfig>, db: DB, configService: ConfigService<IMetadataReaderConfig>): IMetadataRepo => {
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
    MetadataReaderService,
    TokensRepo,
    ContractsRepo,
    S3Provider,
  ],
  exports: [ MetadataReaderService, S3Provider ],
  imports: [ DBModule ],
})
export class MetadataReaderModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Provider } from '@shared/aws';
import { ContractsRepo } from '@shared/contracts';
import { DB, DBModule } from '@shared/db';
import {
  HttpReader,
  IMetadataRepo,
  METADATA_REPO_PROVIDER,
  MetadataRepoDB,
  MetadataRepoStorage,
  MetadataRepoType,
} from '@shared/metadata';
import { TokensRepo } from '@shared/tokens';
import { IApiConfig, IServiceConfig } from '../app.config';
import {
  MetadataControllerV0,
  MetadataControllerV1,
} from './metadata.controller';
import { MetadataService } from './metadata.service';

/**
 * Metadata Module
 */
@Module({
  controllers: [ MetadataControllerV0, MetadataControllerV1 ],
  providers: [
    MetadataService,
    ConfigService,
    S3Provider,
    TokensRepo,
    ContractsRepo,
    HttpReader,
    {
      provide: METADATA_REPO_PROVIDER,
      inject: [ S3Provider, DB, ConfigService<IApiConfig> ],
      useFactory: (
        s3Provider: S3Provider<IApiConfig>,
        db: DB,
        configService: ConfigService<IApiConfig>,
      ): IMetadataRepo => {
        const serviceConfig = configService.get<IServiceConfig>(
          'service',
        ) as IServiceConfig;
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
  imports: [ DBModule ],
  exports: [ MetadataService ],
})
export class MetadataModule {}

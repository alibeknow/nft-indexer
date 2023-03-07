import { IServiceConfig, IStaxStatisticsConfig } from '../app.config';
import { IOpensearchConfig, OpensearchProvider } from '@shared/opensearch';
import { Inject, Injectable } from '@nestjs/common';
import { logger } from '@shared/logger';
import { ConfigService } from '@nestjs/config';
import { OpenSearchWhereFieldAuxiliary } from './opensearch.auxiliary';
import { S3Provider } from '@shared/aws';
import { OPENSEARCH_FIELD_PARAMS } from './constansts';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';

@Injectable()
export class StaxMetadataService {
  private serviceConfig: IServiceConfig;
  private opensearchConfig: IOpensearchConfig;
  private params = OPENSEARCH_FIELD_PARAMS;

  constructor(
    @Inject(S3Provider) private readonly s3Provider: S3Provider<IStaxStatisticsConfig>,
    private readonly configService: ConfigService<IStaxStatisticsConfig>,
    private readonly opensearchProvider: OpensearchProvider<IStaxStatisticsConfig>,
  ) {
    this.serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
    this.opensearchConfig = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
  }

  async run() {
    const openSearchWhereFieldAuxiliary = new OpenSearchWhereFieldAuxiliary(
      this.opensearchProvider, {
        indexName: this.opensearchConfig.indexNameMetadata,
        params: this.params,
      },
    );
    openSearchWhereFieldAuxiliary.push('contractAddress,tokenID\n');

    const passThroughToS3Bucket = new PassThrough();
    const passThroughToFile = new PassThrough();

    openSearchWhereFieldAuxiliary.pipe(passThroughToS3Bucket);
    openSearchWhereFieldAuxiliary.pipe(passThroughToFile);

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    const file = createWriteStream(`${formattedDate}.csv`);
    passThroughToFile.pipe(file);

    passThroughToFile.on('end', () => {
      logger.info(`Writing to file is finished: ${formattedDate}.csv`);
      file.end();
    });

    const result: AWS.S3.PutObjectOutput = await this.s3Provider.storage.upload({
      Bucket: this.serviceConfig.awsBucket,
      Key: `${formattedDate}.csv`,
      Body: passThroughToS3Bucket,
    }).promise();

    if (result) {
      logger.info('Uploading to S3 Bucket is finished');
    } else {
      logger.error('Uploading to S3 Bucket is failed');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import { DeleteObjectsRequest } from 'aws-sdk/clients/s3';
import { IBaseConfig } from '@shared/baseconfig';
import { IAWSConfig, getAWSConfig } from '@shared/aws';

@Injectable()
export class S3Provider<T extends IBaseConfig> {
  public storage: AWS.S3;

  constructor(private configService: ConfigService<T>) {
    // TODO Refactor configuration with ConfigModule refactoring
    // const awsConfig = this.configService.get<IAWSConfig>('aws') as IAWSConfig;
    const awsConfig: IAWSConfig = getAWSConfig() as IAWSConfig;
    const awsEndpoint = awsConfig.endpoint;
    const endpoint = awsEndpoint ? new AWS.Endpoint(awsEndpoint) : undefined;

    this.storage = new AWS.S3({
      accessKeyId: awsConfig.accessKey,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
      endpoint,
      s3ForcePathStyle: true,
    });
  }

  public async objectExist(bucket: string, key: string): Promise<boolean> {
    const result: AWS.S3.HeadObjectOutput = await this.storage.headObject({
      Bucket: bucket,
      Key: key,
    }).promise();

    return !!result;
  }

  public async emptyFolder(bucket: string, directory: string): Promise<void> {
    try {
      const listResult: AWS.S3.ListObjectsV2Output = await this.storage.listObjects({
        Bucket: bucket,
        Prefix: directory,
      }).promise();

      if (!listResult.Contents || listResult.Contents?.length === 0) {
        return;
      }

      const params: DeleteObjectsRequest = { Bucket: bucket, Delete: { Objects: [] } };

      listResult.Contents.forEach((content: AWS.S3.Object) => {
        const { Key } = content;

        if (Key) {
          params.Delete.Objects.push({ Key });
        }
      });

      const deleteResult = await this.storage.deleteObjects(params).promise();

      if (deleteResult.Deleted?.length === 1000) {
        return this.emptyFolder(bucket, directory);
      }
    } catch (err) {
      return;
    }
  }
}

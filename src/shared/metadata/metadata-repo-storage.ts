import { Inject, Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { S3Provider } from '@shared/aws';
import { logger } from '@shared/logger';
import { UriProtocol } from '@shared/metadata';
import { IMetadataRepo, Metadata } from './interfaces';
import { IBaseConfig } from '@shared/baseconfig';

@Injectable()
export class MetadataRepoStorage implements IMetadataRepo {
  private _bucket: string;

  constructor(
    @Inject(S3Provider) private readonly s3Provider: S3Provider<IBaseConfig>,
    bucket: string,
  ) {
    this._bucket = bucket;
  }

  /**
   * Recieve metadata list by array of identifiers
   *
   * @example
   * await getWhereIdIn(['eth:0x9FB2EEb757...a5dc404f:f12', 'eth:0x9FB2EEb757...a5dc404f:d21'])
   *
   * @param {string[]} ids array of token identifiers
   * @returns {Promise<Metadata[]>} array of metatada
   */
  public async getWhereIdIn(ids: string[]): Promise<Metadata[]> {
    const result: Metadata[] = (await Promise.all(ids.map(async (_id) => {
      try {
        const objectData = await this.s3Provider.storage.getObject({
          Bucket: this._bucket,
          Key: `${_id}.json`,
        }).promise();

        const metadataItem: Metadata = JSON.parse((objectData.Body as Buffer)?.toString());

        return metadataItem;
      } catch (err) {
        logger.error(err, 'error get object from s3');

        return null;
      }
    }))).filter((item) => !!item) as Metadata[];

    return result;
  }

  /**
   * Save metadata to AWS S3 Bucket
   *
   * @example
   * await save('eth:0x9FB2EEb757...a5dc404f:f12', 'metadata', 'protocol')
   *
   * @param {string} tokenId identifier of given token
   * @param {string} metadata token metadata
   * @param {string} protocol uri protocol
   * @returns {Promise<Metadata>} result
   */
  public async save(tokenId: string, metadata: string, protocol: UriProtocol): Promise<Metadata | null> {
    const metadataItem: Metadata = {
      _id: tokenId,
      metadata,
      type: protocol,
    };

    const result: AWS.S3.PutObjectOutput = await this.s3Provider.storage.putObject({
      Bucket: this._bucket,
      Key: `${tokenId}.json`,
      Body: Buffer.from(JSON.stringify(metadataItem), 'utf-8'),
    }).promise();

    if (result) {
      return metadataItem;
    }

    return null;
  }
}

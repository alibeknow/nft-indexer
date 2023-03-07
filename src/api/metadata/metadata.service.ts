import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import { logger } from '@shared/logger';
import {
  HttpReader,
  IMetadataRepo,
  METADATA_REPO_PROVIDER,
  Metadata,
  NftData,
} from '@shared/metadata';
import { BigNumber } from 'ethers';
import { ValidationError, Validator } from 'jsonschema';
import { WithId } from 'mongodb';
import { IApiConfig, IServiceConfig } from '../app.config';

export type StaxMetadata = {
  ledger_stax_image: string;
  [key: string]: unknown;
};

export class NftError {
  @ApiProperty()
    id!: string;

  @ApiProperty()
    errors!: string[] | ValidationError[];
}

/**
 * Metadata Service
 */
@Injectable()
export class MetadataService {
  private readonly validator = new Validator();
  private readonly staxUri?: string;

  constructor(
    @Inject(METADATA_REPO_PROVIDER)
    private readonly metadataRepo: IMetadataRepo,
    private readonly configService: ConfigService<IApiConfig>,
    private readonly httpReader: HttpReader,
  ) {
    const serviceConfig = this.configService.get<IServiceConfig>(
      'service',
    ) as IServiceConfig;
    this.staxUri = serviceConfig.staxUri;
  }

  /**
   * Returns list of metadata items by array of ids
   * @param {string[]} array of ids
   */
  public async getWhereIdIn(ids: string[]): Promise<WithId<Metadata>[]> {
    return this.metadataRepo.getWhereIdIn(ids);
  }

  /**
   * Checks Validates and transforms metadata
   * @param {WithId<Metadata>} Metadata mongodb document
   */
  public checkNftMetadataFormat(nftMetadata: WithId<Metadata>): NftData {
    let metadata: NftData;
    const content: Record<string, string>[] = [];

    try {
      metadata = JSON.parse(nftMetadata.metadata) as NftData;
    } catch (error: unknown) {
      logger.error(error, 'cant parse JSON wrong format');

      throw new HttpException(
        'Metadata doesn’t follow the ERC-721/1155 Metadata Schema',
        204,
      );
    }

    if (metadata.animation_url) {
      content.push({ type: 'animation_url', url: metadata.animation_url });
    }
    if (metadata.youtube_url) {
      content.push({ type: 'youtube_url', url: metadata.youtube_url });
    }
    if (metadata.image) {
      content.push({ type: 'image', url: metadata.image });
    }

    metadata.content = content;

    return metadata;
  }

  public async getStaxMetadata(
    tokenId: string,
  ): Promise<StaxMetadata | undefined> {
    let result: StaxMetadata | undefined;
    if (this.staxUri) {
      const token = tokenId.split(':');
      const uri = `${
        this.staxUri
      }/staxImage/homestead/${token[1].toLowerCase()}/${BigNumber.from(
        token[2],
      ).toString()}`;

      try {
        result = {
          ledger_stax_image: await this.httpReader.read(uri),
        } as StaxMetadata;
      } catch (error) {
        logger.error({ msg: 'Error reading STAX metadata', error });
      }
    }

    return result;
  }
}

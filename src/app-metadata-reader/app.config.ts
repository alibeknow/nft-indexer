import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';
import { MetadataRepoType } from '@shared/metadata';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  workersCount: number;
  repoProvider: MetadataRepoType;
  awsBucket?: string;
  usePinata: boolean;
  pinataRetries: number;
  pinataDedicatedGatewayFallback?: string;
  ipfsGatewayFallback: boolean;
  defaultGateway: string;
  proxyCredentials?: string;
  requestTimeout?: number;
}

export interface IMetadataReaderConfig extends IBaseConfig {
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly listenHost?: string;

  @IsInt()
  readonly workersCount!: number;

  @IsEnum(MetadataRepoType)
  readonly repoProvider!: MetadataRepoType;

  @IsString()
  @IsOptional()
  readonly awsBucket?: string;

  @IsBoolean()
  readonly usePinata!: boolean;

  @IsInt()
  readonly pinataRetries!: number;

  @IsString()
  @IsOptional()
  readonly pinataDedicatedGatewayFallback?: string;

  @IsBoolean()
  readonly ipfsGatewayFallback!: boolean;

  @IsString()
  @IsOptional()
  readonly defaultGateway!: string;

  @IsString()
  @IsOptional()
  readonly proxyCredentials?: string;

  @IsInt()
  @IsOptional()
  readonly requestTimeout?: number;
}

class MetadataReaderConfigValidator extends BaseConfigValidator implements IMetadataReaderConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getMetadataReaderConfig = (): IMetadataReaderConfig => {
  const config: IMetadataReaderConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.METADATA_READER_API_PORT ?? 8083}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      workersCount: parseInt(`${process.env.METADATA_READER_WORKERS ?? 1}`, 10) as number,
      repoProvider: process.env.METADATA_REPO_PROVIDER as MetadataRepoType,
      awsBucket: process.env.METADATA_READER_AWS_BUCKET,
      usePinata: process.env.USE_PINATA === 'true',
      pinataRetries: parseInt(`${process.env.PINATA_RETRIES ?? 1}`, 10) as number,
      pinataDedicatedGatewayFallback: process.env.PINATA_DEDICATED_GATEWAY_FALLBACK as string,
      ipfsGatewayFallback: process.env.IPFS_GATEWAY_FALLBACK === 'true',
      defaultGateway: process.env.PINATA_DEFAULT_GATEWAY as string,
      proxyCredentials: process.env.PROXY_CREDENTIALS,
      requestTimeout: parseInt(`${process.env.METADATA_READER_REQUEST_TIMEOUT ?? 0}`, 10) as number,
    },
  };

  return validate<IMetadataReaderConfig, MetadataReaderConfigValidator>(config, MetadataReaderConfigValidator);
};

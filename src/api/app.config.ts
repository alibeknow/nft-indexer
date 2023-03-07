import { IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';
import { MetadataRepoType } from '@shared/metadata';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  repoProvider: MetadataRepoType;
  awsBucket?: string;
  staxUri?: string;
}

export interface IApiConfig extends IBaseConfig {
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly listenHost?: string;

  @IsEnum(MetadataRepoType)
  readonly repoProvider!: MetadataRepoType;

  @IsString()
  @IsOptional()
  readonly awsBucket?: string;

  @IsString()
  @IsOptional()
  readonly staxUri?: string;
}

class ApiConfigValidator extends BaseConfigValidator implements IApiConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getApiConfig = (): IApiConfig => {
  const config: IApiConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.API_PORT ?? 8090}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      repoProvider: process.env.METADATA_REPO_PROVIDER as MetadataRepoType,
      awsBucket: process.env.METADATA_READER_AWS_BUCKET,
      staxUri: process.env.STAX_ENDPOINT,
    },
  };

  return validate<IApiConfig, ApiConfigValidator>(config, ApiConfigValidator);
};

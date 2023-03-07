import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  countOnPage: number;
}

export interface IOpensearchIndexerConfig extends IBaseConfig {
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly listenHost?: string;

  @IsInt()
  readonly countOnPage!: number;
}

class OpensearchIndexerConfigValidator extends BaseConfigValidator implements IOpensearchIndexerConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getOpensearchIndexerConfig = (): IOpensearchIndexerConfig => {
  const config: IOpensearchIndexerConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.OPENSEARCH_INDEXER_API_PORT ?? 8089}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      countOnPage: parseInt(`${process.env.OPENSEARCH_INDEXATION_COUNT_ON_PAGE ?? 1000}`, 10) as number,
    },
  };

  return validate<IOpensearchIndexerConfig, OpensearchIndexerConfigValidator>(config, OpensearchIndexerConfigValidator);
};

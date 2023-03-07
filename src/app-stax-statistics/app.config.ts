import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  countOnPage: number;
  awsBucket: string;
}

export interface IStaxStatisticsConfig extends IBaseConfig {
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

  @IsString()
  readonly awsBucket!: string;
}

class StaxStatisticsConfigValidator extends BaseConfigValidator implements IStaxStatisticsConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getStaxStatisticsConfig = (): IStaxStatisticsConfig => {
  const config: IStaxStatisticsConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.STAX_STATISTICS_API_PORT ?? 8089}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      countOnPage: parseInt(`${process.env.OPENSEARCH_INDEXATION_COUNT_ON_PAGE ?? 1000}`, 10) as number,
      awsBucket: process.env.STAX_STATISTICS_AWS_BUCKET as string,
    },
  };

  return validate<IStaxStatisticsConfig, StaxStatisticsConfigValidator>(config, StaxStatisticsConfigValidator);
};

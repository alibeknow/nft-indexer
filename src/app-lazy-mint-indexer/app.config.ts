import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  workersCount: number;
  chainName: Blockchain;
}

export interface ILazyMintIndexerConfig extends IBaseConfig {
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

  @IsString()
  readonly chainName!: Blockchain;
}

class LazyMintIndexerConfigValidator extends BaseConfigValidator implements ILazyMintIndexerConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getLazyMintIndexerConfig = (): ILazyMintIndexerConfig => {
  const config: ILazyMintIndexerConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.LAZY_MINT_INDEXER_API_PORT ?? 8088}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      workersCount: parseInt(`${process.env.LAZY_MINT_INDEXER_WORKERS ?? 1}`, 10) as number,
      chainName: process.env.CHAIN_NAME as Blockchain,
    },
  };

  return validate<ILazyMintIndexerConfig, LazyMintIndexerConfigValidator>(config, LazyMintIndexerConfigValidator);
};

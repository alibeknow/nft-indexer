import { IsEnum, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';

export interface IServiceConfig {
  port: number;
  blockNumberFrom: number;
  blockNumberTo: number;
  limit: number;
  chainName: Blockchain;
}

export interface IPreContractsConfig extends IBaseConfig {
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsInt()
  readonly blockNumberFrom!: number;

  @IsInt()
  readonly blockNumberTo!: number;

  @IsInt()
  readonly limit!: number;

  @IsEnum(Blockchain)
  readonly chainName!: Blockchain;
}

class PreContractsConfigValidator extends BaseConfigValidator implements IPreContractsConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getPreContractsConfig = (): IPreContractsConfig => {
  const config: IPreContractsConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.PRE_CONTRACT_INDEXING_API_PORT ?? 8090}`, 10) as number,
      blockNumberFrom: parseInt(`${process.env.BLOCK_NUMBER_FROM ?? 0}`, 10) as number,
      blockNumberTo: parseInt(`${process.env.BLOCK_NUMBER_TO ?? 0}`, 10) as number,
      limit: parseInt(`${process.env.EVENTS_READER_LIMIT ?? 0}`, 10) as number,
      chainName: process.env.CHAIN_NAME as Blockchain,
    },
  };

  return validate<IPreContractsConfig, PreContractsConfigValidator>(config, PreContractsConfigValidator);
};

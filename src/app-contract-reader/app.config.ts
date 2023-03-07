import { IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  workersCount: number;
  pre721ContractsEnabled: boolean;
}

export interface IContractReaderConfig extends IBaseConfig {
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

  @IsBoolean()
  readonly pre721ContractsEnabled!: boolean;
}

class ContractReaderConfigValidator extends BaseConfigValidator implements IContractReaderConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getContractReaderConfig = (): IContractReaderConfig => {
  const config: IContractReaderConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.CONTRACT_READER_API_PORT ?? 8082}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      workersCount: parseInt(`${process.env.CONTRACT_READER_WORKERS ?? 1}`, 10) as number,
      pre721ContractsEnabled: process.env.PRE_721_CONTRACTS_ENABLED === 'true',
    },
  };

  return validate<IContractReaderConfig, ContractReaderConfigValidator>(config, ContractReaderConfigValidator);
};

import { IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfigValidator, IBaseConfig, getBaseConfig, validate } from '@shared/baseconfig';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  pre721ContractsEnabled: boolean;
  checkInterval: number;
  processingLimit: number;
}

export interface IEventsReaderConfig extends IBaseConfig {
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly listenHost?: string;

  @IsBoolean()
  readonly pre721ContractsEnabled!: boolean;

  @IsInt()
  readonly checkInterval!: number;

  @IsInt()
  readonly processingLimit!: number;
}

class EventsReaderConfigValidator extends BaseConfigValidator implements IEventsReaderConfig {
  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

const baseConfig: IBaseConfig = getBaseConfig();

export const getEventsReaderConfig = (): IEventsReaderConfig => {
  const config: IEventsReaderConfig = {
    ...baseConfig,
    service: {
      port: parseInt(`${process.env.EVENTS_READER_API_PORT ?? 8080}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      pre721ContractsEnabled: process.env.PRE_721_CONTRACTS_ENABLED === 'true',
      checkInterval: parseInt(`${process.env.EVENTS_READER_CHECK_INTERVAL ?? 10}`, 10) as number,
      processingLimit: parseInt(`${process.env.EVENTS_READER_PROCESSING_LIMIT ?? 50}`, 10) as number,
    },
  };

  return validate<IEventsReaderConfig, EventsReaderConfigValidator>(config, EventsReaderConfigValidator);
};

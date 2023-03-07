import { CronExpression } from '@nestjs/schedule';
import { AppConfigValidator, IAppConfig, getAppConfig } from '@shared/baseconfig';
import { Type, plainToClass } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested, validateSync } from 'class-validator';

export interface IServiceConfig {
  port: number;
  listenHost?: string;
  refreshInterval: string;
}

export interface IRefreshConfig {
  app: IAppConfig;
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsOptional()
  @IsString()
  readonly listenHost?: string;

  @IsString()
  readonly refreshInterval!: string;
}

class RefreshConfigValidator implements IRefreshConfig {
  @ValidateNested()
  @Type(() => AppConfigValidator)
  readonly app!: AppConfigValidator;

  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

export const getRefreshConfig = (): IRefreshConfig => {
  const config: IRefreshConfig = {
    app: getAppConfig(),
    service: {
      port: parseInt(`${process.env.REFRESH_API_PORT ?? 8086}`, 10) as number,
      listenHost: process.env.LISTEN_HOST,
      refreshInterval: process.env.REFRESH_INTERVAL || CronExpression.EVERY_12_HOURS,
    },
  };

  return validate(config, RefreshConfigValidator);
};

export function validate(configuration: IRefreshConfig, validationClass: new () => RefreshConfigValidator): IRefreshConfig {
  const finalConfig = plainToClass(
    validationClass,
    configuration,
    { enableImplicitConversion: true },
  );

  const errors = validateSync(finalConfig, { skipMissingProperties: true });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return finalConfig;
}

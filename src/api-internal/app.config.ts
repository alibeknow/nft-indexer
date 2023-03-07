import { IsInt, IsOptional, IsString, ValidateNested, validateSync } from 'class-validator';
import { Type, plainToClass } from 'class-transformer';
import { AppConfigValidator, IAppConfig, getAppConfig } from '@shared/baseconfig';

export interface IServiceConfig {
  port: number;
  authToken: string;
  listenHost?: string;
}

export interface IApiInternalConfig {
  app: IAppConfig;
  service: IServiceConfig;
}

export class ServiceConfigValidator implements IServiceConfig {
  @IsInt()
  readonly port!: number;

  @IsString()
  readonly authToken!: string;

  @IsString()
  @IsOptional()
  readonly listenHost?: string;
}

class ApiConfigValidator implements IApiInternalConfig {
  @ValidateNested()
  @Type(() => AppConfigValidator)
  readonly app!: AppConfigValidator;

  @ValidateNested()
  @Type(() => ServiceConfigValidator)
  readonly service!: ServiceConfigValidator;
}

export const getApiInternalConfig = (): IApiInternalConfig => {
  const config: IApiInternalConfig = {
    app: getAppConfig(),
    service: {
      port: parseInt(`${process.env.API_INTERNAL_PORT ?? 8091}`, 10) as number,
      authToken: process.env.API_AUTH_TOKEN as string,
      listenHost: process.env.LISTEN_HOST,
    },
  };

  return validate(config, ApiConfigValidator);
};

export function validate(config: IApiInternalConfig, ValidationClass: new() => ApiConfigValidator): ApiConfigValidator {
  const validatedConfig = plainToClass(
    ValidationClass,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

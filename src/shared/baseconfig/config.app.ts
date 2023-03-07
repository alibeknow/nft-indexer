import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
}

export interface IAppConfig {
  version?: string;
  logLevel: string;
}

export class AppConfigValidator implements IAppConfig {
  @IsString()
  @IsOptional()
  readonly version?: string;

  @IsEnum(LogLevel)
  readonly logLevel!: LogLevel;
}

export const getAppConfig = (): IAppConfig => ({
  version: process.env.APP_VERSION,
  logLevel: process.env.LOG_LEVEL || LogLevel.INFO,
});


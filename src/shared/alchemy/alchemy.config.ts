import { IsOptional, IsString } from 'class-validator';

export interface IAlchemyConfig {
  alchemyApiKey?: string;
}

export class AlchemyConfigValidator implements IAlchemyConfig {
  @IsString()
  @IsOptional()
  readonly alchemyApiKey?: string;
}

export const getAlchemyConfig = (): IAlchemyConfig => ({
  alchemyApiKey: process.env.ALCHEMY_API_KEY,
});

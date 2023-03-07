import { IsOptional, IsString } from 'class-validator';

export interface IExplorersClientConfig {
  explorersApi?: string;
}

export class ExplorersClientConfigValidator implements IExplorersClientConfig {
  @IsString()
  @IsOptional()
  readonly explorersApi?: string;
}

/**
 * Returns ExplorersClient config
 */
export const getExplorersClientConfig = (): IExplorersClientConfig => ({
  explorersApi: process.env.EXPLORERS_API,
});

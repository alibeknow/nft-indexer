import { ExplorersClientConfigValidator, IExplorersClientConfig, getExplorersClientConfig } from '@shared/explorers-client';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { AlchemyConfigValidator, IAlchemyConfig, getAlchemyConfig } from '@shared/alchemy';
import { IWeb3Config, Web3ConfigValidator, getWeb3Config } from '@shared/web3';
import { DatabaseConfigValidator, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { AWSConfigValidator, IAWSConfig, getAWSConfig } from '@shared/aws';
import {
  IMicroservicesConfig, IRabbitConfig, ISqsConfig,
  MicroservicesConfigValidator, RabbitConfigValidator, SqsConfigValidator,
  getMicroservicesConfig, getRabbitConfig, getSqsConfig,
} from '@shared/microservices';
import { IOpensearchConfig, OpensearchConfigValidator, getOpensearchConfig } from '@shared/opensearch';
import { AppConfigValidator, IAppConfig, getAppConfig } from './config.app';
import { IOpenseaConfig, OpenseaConfigValidator, getOpenseaConfig } from '@shared/opensea';

export interface IBaseConfig {
  app: IAppConfig;
  alchemy: IAlchemyConfig;
  explorersClient: IExplorersClientConfig;
  aws: IAWSConfig;
  database: IDatabaseConfig;
  microservices: IMicroservicesConfig;
  opensearch: IOpensearchConfig;
  opensea: IOpenseaConfig;
  rabbit: IRabbitConfig;
  sqs: ISqsConfig;
  web3: IWeb3Config;
}

export class BaseConfigValidator implements IBaseConfig {
  @ValidateNested()
  @Type(() => AppConfigValidator)
  readonly app!: AppConfigValidator;

  @ValidateNested()
  @Type(() => AlchemyConfigValidator)
  readonly alchemy!: AlchemyConfigValidator;

  @ValidateNested()
  @Type(() => ExplorersClientConfigValidator)
    explorersClient!: ExplorersClientConfigValidator;

  @ValidateNested()
  @Type(() => AWSConfigValidator)
  readonly aws!: AWSConfigValidator;

  @ValidateNested()
  @Type(() => DatabaseConfigValidator)
  readonly database!: DatabaseConfigValidator;

  @ValidateNested()
  @Type(() => MicroservicesConfigValidator)
  readonly microservices!: MicroservicesConfigValidator;

  @ValidateNested()
  @Type(() => RabbitConfigValidator)
  readonly rabbit!: RabbitConfigValidator;

  @ValidateNested()
  @Type(() => SqsConfigValidator)
  readonly sqs!: SqsConfigValidator;

  @ValidateNested()
  @Type(() => Web3ConfigValidator)
  readonly web3!: Web3ConfigValidator;

  @ValidateNested()
  @Type(() => OpensearchConfigValidator)
  readonly opensearch!: OpensearchConfigValidator;

  @ValidateNested()
  @Type(() => OpenseaConfigValidator)
  readonly opensea!: OpenseaConfigValidator;
}

export const getBaseConfig = (): IBaseConfig => ({
  app: getAppConfig(),
  alchemy: getAlchemyConfig(),
  explorersClient: getExplorersClientConfig(),
  aws: getAWSConfig(),
  database: getDatabaseConfig(),
  microservices: getMicroservicesConfig(),
  rabbit: getRabbitConfig(),
  sqs: getSqsConfig(),
  web3: getWeb3Config(),
  opensearch: getOpensearchConfig(),
  opensea: getOpenseaConfig(),
});

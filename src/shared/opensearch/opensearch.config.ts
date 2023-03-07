import { IsNumber, IsOptional, IsString } from 'class-validator';

export interface IOpensearchConfig {
  host: string;
  protocol: string;
  port: number;
  indexNameMetadata: string;
  indexNameContracts: string;
  auth?: string;
  caPath?: string;
  numberOfShards: number;
  numberOfReplicas: number;
}

export class OpensearchConfigValidator implements IOpensearchConfig {
  @IsString()
  readonly host!: string;

  @IsString()
  readonly protocol!: string;

  @IsNumber()
  readonly port!: number;

  @IsString()
  readonly indexNameMetadata!: string;

  @IsString()
  readonly indexNameContracts!: string;

  @IsString()
  @IsOptional()
  readonly auth?: string;

  @IsString()
  @IsOptional()
  readonly caPath?: string;

  @IsNumber()
  @IsOptional()
  readonly numberOfShards!: number;

  @IsNumber()
  @IsOptional()
  readonly numberOfReplicas!: number;
}

export const getOpensearchConfig = (): IOpensearchConfig => ({
  host: process.env.OPENSEARCH_HOST as string,
  port: parseInt(`${process.env.OPENSEARCH_PORT}`, 10) as number,
  protocol: process.env.OPENSEARCH_PROTOCOL || 'http',
  indexNameMetadata: process.env.OPENSEARCH_INDEX_NAME_METADATA as string,
  indexNameContracts: process.env.OPENSEARCH_INDEX_NAME_CONTRACTS as string,
  auth: process.env.OPENSEARCH_AUTH,
  caPath: process.env.OPENSEARCH_CA_PATH,
  numberOfShards: parseInt(`${process.env.OPENSEARCH_NUMBER_OF_SHARDS || 1}`, 10) as number,
  numberOfReplicas: parseInt(`${process.env.OPENSEARCH_NUMBER_OF_REPLICAS || 1}`, 10) as number,
});

export const getOpensearchConnectionUri = (config: IOpensearchConfig): string => {
  const { protocol, host, port, auth } = config;

  if (config.auth) {
    return `${protocol}://${auth}@${host}:${port}`;
  }

  return `${protocol}://${host}:${port}`;
};

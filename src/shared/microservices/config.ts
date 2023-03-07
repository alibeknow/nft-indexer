import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import { CommunicationTransport } from '@shared/microservices';

export enum RabbitProtocol {
  AMQP = 'amqp',
  AMQPS = 'amqps',
}

export interface IMicroservicesConfig {
  transport: CommunicationTransport;
}

export interface ISqsConfig {
  messageDeduplication?: boolean;
  messageGrouping?: boolean;
  queueWorkersCount?: number;
  blocksQueue: string;
  contractsQueue: string;
  metadataQueue: string;
}

export type QueueType = keyof Pick<ISqsConfig, 'blocksQueue' | 'contractsQueue' | 'metadataQueue'>;

export interface IRabbitConfig {
  protocol: RabbitProtocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
  blocksQueue: string;
  contractsQueue: string;
  metadataQueue: string;
}

export class MicroservicesConfigValidator implements IMicroservicesConfig {
  @IsEnum(CommunicationTransport)
  readonly transport!: CommunicationTransport;
}

export class SqsConfigValidator implements ISqsConfig {
  @IsBoolean()
  @IsOptional()
  readonly messageDeduplication?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly messageGrouping?: boolean;

  @IsInt()
  @IsOptional()
  readonly queueWorkersCount?: number;

  @IsString()
  readonly blocksQueue!: string;

  @IsString()
  readonly contractsQueue!: string;

  @IsString()
  readonly metadataQueue!: string;
}

export class RabbitConfigValidator implements IRabbitConfig {
  @IsEnum(RabbitProtocol)
  readonly protocol!: RabbitProtocol;

  @IsString()
  readonly host!: string;

  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly username?: string;

  @IsString()
  @IsOptional()
  readonly password?: string;

  @IsString()
  readonly blocksQueue!: string;

  @IsString()
  readonly contractsQueue!: string;

  @IsString()
  readonly metadataQueue!: string;
}

export const getMicroservicesConfig = (): IMicroservicesConfig => ({
  transport: process.env.COMMUNICATION_TRANSPORT as CommunicationTransport,
});

export const getSqsConfig = (): ISqsConfig => ({
  messageDeduplication: process.env.SQS_MESSAGE_DEDUPLICATION === 'true',
  messageGrouping: process.env.SQS_MESSAGE_GROUPING === 'true',
  queueWorkersCount: parseInt(`${process.env.SQS_QUEUE_WORKERS_COUNT ?? 1}`, 10) as number,
  blocksQueue: process.env.SQS_BLOCKS_QUEUE as string,
  contractsQueue: process.env.SQS_CONTRACTS_QUEUE as string,
  metadataQueue: process.env.SQS_METADATA_QUEUE as string,
});

export const getRabbitConfig = (): IRabbitConfig => ({
  protocol: process.env.RABBIT_PROTOCOL as RabbitProtocol,
  host: process.env.RABBIT_HOST as string,
  port: parseInt(`${process.env.RABBIT_PORT}`, 10) as number,
  username: process.env.RABBIT_USERNAME as string,
  password: process.env.RABBIT_PASSWORD as string,
  blocksQueue: process.env.RABBIT_BLOCK_READ_QUEUE as string,
  contractsQueue: process.env.RABBIT_CONTRACT_READ_QUEUE as string,
  metadataQueue: process.env.RABBIT_METADATA_READ_QUEUE as string,
});

export const getRabbitUrl = (config: IRabbitConfig): string => {
  const { protocol, username, password, host, port } = config;

  if (username && password) {
    return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `${protocol}://${host}:${port}`;
};

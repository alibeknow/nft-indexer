import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum Web3Protocol {
  HTTP = 'http',
  HTTPS = 'https',
}

export interface IWeb3Config {
  protocol: string;
  host: string;
  username?: string;
  password?: string;
}

export class Web3ConfigValidator implements IWeb3Config {
  @IsEnum(Web3Protocol)
  readonly protocol!: Web3Protocol;

  @IsString()
  readonly host!: string;

  @IsString()
  @IsOptional()
  readonly username?: string;

  @IsString()
  @IsOptional()
  readonly password?: string;
}

export const getWeb3Config = (): IWeb3Config => ({
  protocol: process.env.NODE_PROTOCOL as string,
  host: process.env.NODE_HOST as string,
  username: process.env.NODE_USERNAME,
  password: process.env.NODE_PASSWORD,
});

export const getNodeAddress = (config: IWeb3Config): string => {
  const { protocol, host } = config;

  return `${protocol}://${host}`;
};

export const getAuth = (config: IWeb3Config): { user: string | undefined; password: string | undefined } => {
  const { username, password } = config;

  return { user: username, password };
};

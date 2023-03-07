import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export interface IDatabaseConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  db: string;
  enableSsl: boolean;
  directConection: boolean;
}

export class DatabaseConfigValidator implements IDatabaseConfig {
  @IsString()
  readonly host!: string;

  @IsInt()
  readonly port!: number;

  @IsString()
  @IsOptional()
  readonly user?: string;

  @IsString()
  @IsOptional()
  readonly password?: string;

  @IsString()
  readonly db!: string;

  @IsBoolean()
  readonly enableSsl!: boolean;

  @IsBoolean()
  readonly directConection!: boolean;
}

export const getDatabaseConfig = (): IDatabaseConfig => ({
  host: process.env.MONGO_HOST as string,
  port: parseInt(`${process.env.MONGO_PORT}`, 10) as number,
  user: process.env.MONGO_USER,
  password: process.env.MONGO_PASS,
  db: process.env.MONGO_DB as string,
  enableSsl: process.env.MONGO_SSL_ENABLED === 'true',
  directConection: process.env.MONGO_DB_DIRECT_CONNECTION === 'true',
});

export const getMongoDBUri = (config: IDatabaseConfig): string => {
  const { user, password, host, port } = config;

  if(user && password) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `mongodb://${host}:${port}`;
};

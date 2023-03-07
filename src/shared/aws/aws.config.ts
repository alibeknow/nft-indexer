import { IsOptional, IsString } from 'class-validator';

export interface IAWSConfig {
  endpoint?: string;
  region: string;
  accessKey: string;
  secretAccessKey: string;
}

export class AWSConfigValidator implements IAWSConfig {
  @IsString()
  @IsOptional()
  readonly endpoint?: string;

  @IsString()
  readonly region!: string;

  @IsString()
  readonly accessKey!: string;

  @IsString()
  readonly secretAccessKey!: string;
}

export const getAWSConfig = (): IAWSConfig => ({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION as string,
  accessKey: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
});

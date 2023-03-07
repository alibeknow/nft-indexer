import { IsOptional, IsString, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
export interface IOpenseaConfig {
  uri?: string;
  api_key?: string;
}

export class OpenseaConfigValidator implements IOpenseaConfig {
  @IsString()
  @IsOptional()
  readonly uri?: string;

  @IsString()
  @IsOptional()
  readonly api_key?: string;
}

export const getOpenseaConfig = (): IOpenseaConfig => {
  const config: IOpenseaConfig = {
    uri: process.env.OPENSEA_ENDPOINT as string,
    api_key: process.env.OPENSEA_API_KEY as string,
  };

  return validate(config, OpenseaConfigValidator);
};

export function validate(configuration: IOpenseaConfig, validationClass: new () => OpenseaConfigValidator): IOpenseaConfig {
  const finalConfig = plainToClass(
    validationClass,
    configuration,
    { enableImplicitConversion: true },
  );

  const errors = validateSync(finalConfig, { skipMissingProperties: true });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return finalConfig;
}

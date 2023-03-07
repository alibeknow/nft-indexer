import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BaseConfigValidator } from './config.base';

export function validate<K, T extends BaseConfigValidator>(config: K, ValidationClass: new () => T): T {
  const validatedConfig = plainToClass(
    ValidationClass,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

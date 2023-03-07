import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { processCryptoPunks } from './cryptopunks';
import { logger } from '@shared/logger';

process.on('uncaughtException', (error) => {
  logger.error({
    name: error.name,
    msg: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

async function bootstrap() {
  const baseConfig: IBaseConfig = getBaseConfig();
  await processCryptoPunks(baseConfig);
}

bootstrap();

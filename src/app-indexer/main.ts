import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootstrapMicroservice } from '@shared/microservices';
import { AppModule } from './app.module';
import { logger } from '@shared/logger';
import { ConfigService } from '@nestjs/config';
import { IIndexerConfig, IServiceConfig } from './app.config';

process.on('uncaughtException', (error) => {
  logger.error({
    name: error.name,
    msg: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

const BLOCK_READ_QUEUE = 'blocksQueue';

/**
 * Indexer bootstrap function
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IIndexerConfig>>(ConfigService<IIndexerConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.enableShutdownHooks();
  await bootstrapMicroservice(app, BLOCK_READ_QUEUE);

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);
}

bootstrap();

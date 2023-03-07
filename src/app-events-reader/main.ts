import client from 'prom-client';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { configureAppDocs, configureAppMiddleware } from '@shared/api';
import { logger } from '@shared/logger';
import { registry } from '@shared/metrics';
import { AppModule } from './app.module';
import { IEventsReaderConfig, IServiceConfig } from './app.config';
import { ConfigService } from '@nestjs/config';

client.collectDefaultMetrics({
  prefix: 'x_node_',
  register: registry,
});

process.on('uncaughtException', (error) => {
  logger.error({
    name: error.name,
    msg: error.message,
    stack: error.stack,
  });
  process.exit(1);
});


/**
 * Events-reader bootstrap function
 * Create NestApplication instance and run loop that pull events from blockchain node
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  const appConfig = app.get<ConfigService<IEventsReaderConfig>>(ConfigService<IEventsReaderConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  configureAppMiddleware(app);
  configureAppDocs(app, 'NFT Events Reader API Docs');

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  app.get(Logger).log(`Server is running at ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`, 'NestApplication');
}

bootstrap();

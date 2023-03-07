import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { configureAppDocs, configureAppMiddleware } from '@shared/api';
import { AppModule } from './app.module';
import { IApiConfig, IServiceConfig } from './app.config';

/**
 * API bootstrap function
 * Creates NestExpressApplication instance and starts to listen a port
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IApiConfig>>(ConfigService<IApiConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  configureAppMiddleware(app);
  configureAppDocs(app, 'NFT Metadata Indexer API Docs');

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  app.get(Logger).log(`Server is running at ${listenHost || 'localhost'}:${port} 🚀`, 'NestApplication');
}

bootstrap();


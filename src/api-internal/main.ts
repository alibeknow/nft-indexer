import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { configureAppDocs, configureAppMiddleware } from '@shared/api';
import { AppModule } from './app.module';
import { IApiInternalConfig, IServiceConfig } from './app.config';
import { AuthGuard } from './auth.guard';

/**
 * API bootstrap function
 * Creates NestExpressApplication instance and starts to listen a port
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IApiInternalConfig>>(ConfigService<IApiInternalConfig>);
  const config = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.useGlobalGuards(new AuthGuard(config));

  configureAppMiddleware(app);
  configureAppDocs(app, 'NFT Metadata Indexer API Docs');

  const { port, listenHost } = config;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  app.get(Logger).log(`Server is running at ${listenHost || 'localhost'}:${port} 🚀`, 'NestApplication');
}

bootstrap();


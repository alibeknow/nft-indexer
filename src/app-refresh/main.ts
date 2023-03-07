import { IRefreshConfig, IServiceConfig } from './app.config';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IRefreshConfig>>(ConfigService<IRefreshConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port} 🚀`);
}

bootstrap().then((): void => {
  return;
});

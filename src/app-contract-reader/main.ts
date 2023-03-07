import client from 'prom-client';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { logger } from '@shared/logger';
import { registry } from '@shared/metrics';
import { bootstrapMicroservice } from '@shared/microservices';
import { IContractReaderConfig, IServiceConfig } from './app.config';
import { AppModule } from './app.module';

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

const CONTRACT_READ_QUEUE = 'contractsQueue';
/**
 * Contract-reader bootstrap function
 * Create NestApplication instance and connect microservice depending on the communication transport: sqs | rmq
*/
async function bootstrap(){
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IContractReaderConfig>>(ConfigService<IContractReaderConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.enableShutdownHooks();
  await bootstrapMicroservice(app, CONTRACT_READ_QUEUE);

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);
}

bootstrap();

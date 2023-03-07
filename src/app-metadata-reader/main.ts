import client from 'prom-client';
import { Command } from 'commander';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { logger } from '@shared/logger';
import { registry } from '@shared/metrics';
import { bootstrapMicroservice } from '@shared/microservices';
import { AppModule } from './app.module';
import { IMetadataReaderConfig, IServiceConfig } from './app.config';
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

const METADATA_READ_QUEUE = 'metadataQueue';

/**
 * Register command-line interface for metadata reader
 */
const program = new Command();
program
  .name('NFT Metadata reader')
  .version('0.0.1');

program
  .command('nft-metadata-reader')
  .description('NFT Metadata reader')
  .requiredOption('--check-interval <number>', 'Interval of checking DB in seconds', Number)
  .option('--workers <number>', 'Number of async workers to process tokens metadata', Number, 10)
  .option('--batch-limit <number>', 'Maximum number of tokens retrieved from DB at once', Number, 1000)
  .option('--run-loop <boolean>', 'Feature flag to enable/disable run loop', Boolean, false)
  .action(readMetadata);

program.parse();

interface InputParams {
  checkInterval: number;
  workers: number;
  batchLimit: number;
  runLoop: boolean;
}

/**
 * Metadata-reader bootstrap function
 * @param {InputParams} input Input parameters defined on command execution
 */
async function readMetadata(input: InputParams): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IMetadataReaderConfig>>(ConfigService<IMetadataReaderConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.enableShutdownHooks();
  await bootstrapMicroservice(app, METADATA_READ_QUEUE);

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);

  if (input.runLoop) {
    logger.info('Running main read metadata loop');
    logger.info(`Started checking DB for new tokens with ${input.checkInterval} seconds interval`);
    await app.get<AppModule>(AppModule).runLoop(input.batchLimit, input.workers, input.checkInterval);
  }
}

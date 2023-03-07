import { Command } from 'commander';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { logger } from '@shared/logger';
import { AppModule } from './app.module';
import { IOpensearchIndexerConfig, IServiceConfig } from './app.config';
import { ConfigService } from '@nestjs/config';

process.on('uncaughtException', (error) => {
  logger.error({
    name: error.name,
    msg: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

/**
 * Register command-line interface for opensearch indexer
 */
const program = new Command();
program
  .name('NFT Opensearch indexer')
  .version('0.0.1');

program
  .command('nft-opensearch-indexer')
  .description('NFT Opensearch indexer')
  .action(opensearchIndex);

program.parse();

async function opensearchIndex(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const appConfig = app.get<ConfigService<IOpensearchIndexerConfig>>(ConfigService<IOpensearchIndexerConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.enableShutdownHooks();
  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);

  logger.info('Running main index process');
  logger.info('Start indexing data to opensearch');
  const appModule = app.get<AppModule>(AppModule);
  await Promise.all([
    appModule.runMetadataIndex(),
    appModule.runContractsIndex(),
  ]);
}

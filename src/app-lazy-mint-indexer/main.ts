import { logger } from '@shared/logger';
import { registry } from '@shared/metrics';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Command } from 'commander';
import client from 'prom-client';
import { ILazyMintIndexerConfig, IServiceConfig } from './app.config';
import { AppModule, InputParams } from './app.module';

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

const program = new Command();
program
  .name('NFT Lazy Mint Indexer')
  .version('0.0.1');

program
  .command('nft-lazy-mint-indexer')
  .description('NFT Events reader')
  .requiredOption('--block-number-from <number>', 'Block number from', Number)
  .option('--block-number-to <number>', 'Block number to', Number)
  .option('--limit <number>', 'Limit', Number, 50)
  .action(readEventsAndTokens);

program.parse();

async function readEventsAndTokens(input: InputParams): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  const appConfig = app.get<ConfigService<ILazyMintIndexerConfig>>(ConfigService<ILazyMintIndexerConfig>);
  const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);

  await app.get<AppModule>(AppModule).runLoop(input);
}

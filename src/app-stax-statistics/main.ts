import { Command } from 'commander';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { logger } from '@shared/logger';
import { AppModule } from './app.module';
import { IServiceConfig, IStaxStatisticsConfig } from './app.config';
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
  .name('NFT Stax statistics')
  .version('0.0.1');

program
  .command('nft-stax-statistics')
  .description('NFT Stax optimized metadata statistics')
  .action(staxStatistics);

program.parse();

async function staxStatistics(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const staxStatisticsConfig = app.get<ConfigService<IStaxStatisticsConfig>>(ConfigService<IStaxStatisticsConfig>);
  const serviceConfig = staxStatisticsConfig.get<IServiceConfig>('service') as IServiceConfig;

  app.enableShutdownHooks();
  const { port, listenHost } = serviceConfig;

  if (listenHost)
    await app.listen(port, listenHost);
  else
    await app.listen(port);

  const host = listenHost ? listenHost : '127.0.0.1';
  logger.info(`Server is running on ${host}:${port}, metrics are exposed on ${host}:${port}/metrics 🚀`);
  logger.info('Running main stax statistics process');
}

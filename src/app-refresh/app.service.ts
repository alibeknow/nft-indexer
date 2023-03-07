import { logger } from '@shared/logger';
import { CronJob } from 'cron';
import { IRefreshConfig, IServiceConfig } from './app.config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class AppService implements OnModuleInit{
  private readonly refreshInterval: string;

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<IRefreshConfig>,
  ){
    const serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;
    this.refreshInterval = serviceConfig.refreshInterval;
  }

  async onModuleInit(): Promise<void> {
    const job = new CronJob(this.refreshInterval, async () => {
      await this.runLoop();
    });

    this.schedulerRegistry.addCronJob('refresh_loop', job);
    job.start();
  }

  async runLoop() {
    logger.info('Calling the method on some interval');
  }
}

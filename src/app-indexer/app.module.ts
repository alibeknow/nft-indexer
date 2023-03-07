import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController, registry } from '@shared/metrics';
import { TokenProcessorModule } from './token-processor';
import client from 'prom-client';
import { StatusController } from '@shared/status/status.controller';

import { getIndexerConfig } from './app.config';

client.collectDefaultMetrics({
  prefix: 'x_node_',
  register: registry,
});

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ getIndexerConfig ],
      isGlobal: true,
    }),
    TokenProcessorModule,
  ],
  controllers: [
    MetricsController, StatusController,
  ],
})
export class AppModule {}

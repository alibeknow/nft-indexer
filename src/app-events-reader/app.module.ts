import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { MetricsController } from '@shared/metrics';
import { EventsReaderModule } from './events-reader';
import { StatusController } from '@shared/status';
import { Web3Provider } from '@shared/web3';
import { IEventsReaderConfig, getEventsReaderConfig } from './app.config';

@Module({
  controllers: [ MetricsController, StatusController ],
  imports: [
    ConfigModule.forRoot({
      load: [ getEventsReaderConfig ],
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
    EventsReaderModule,
  ],
  providers: [
    Web3Provider<IEventsReaderConfig>,
  ],
})
export class AppModule {}

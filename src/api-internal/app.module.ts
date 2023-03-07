import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { StatusController } from '@shared/status';
import { getApiInternalConfig } from './app.config';
import { AppController } from './app.controller';

/**
 * App Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ getApiInternalConfig ],
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
  ],
  controllers: [ StatusController, AppController ],
})
export class AppModule {}

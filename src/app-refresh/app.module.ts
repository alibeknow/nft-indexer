import { StatusController } from '@shared/status';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { getRefreshConfig } from './app.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ getRefreshConfig ],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ StatusController ],
  providers: [ AppService ],
})
export class AppModule {}

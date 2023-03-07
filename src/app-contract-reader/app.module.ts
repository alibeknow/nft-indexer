import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from '@shared/metrics';
import { StatusController } from '@shared/status';
import { ContractReaderModule } from './contract-reader';
import { getContractReaderConfig } from './app.config';

@Module({
  controllers: [ MetricsController, StatusController ],
  imports: [
    ConfigModule.forRoot({
      load: [ getContractReaderConfig ],
      isGlobal: true,
    }),
    ContractReaderModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { StatusController } from '@shared/status';
import { WalletModule } from './wallet';
import { CollectionModule } from './collection';
import { MetadataModule } from './metadata';
import { RefreshModule } from './refresh';
import { OwnerModule } from './owner';
import { getApiConfig } from './app.config';
import { SearchModule } from './search/search.module';

/**
 * App Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ getApiConfig ],
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
    SearchModule,
    CollectionModule,
    MetadataModule,
    WalletModule,
    OwnerModule,
    RefreshModule,
  ],
  controllers: [ StatusController ],
})
export class AppModule {}

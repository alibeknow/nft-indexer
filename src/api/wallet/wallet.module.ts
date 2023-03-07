import { MetadataModule } from '@api/metadata';
import { Module } from '@nestjs/common';
import { ExplorersClient } from '@shared/explorers-client';
import { IApiConfig } from '@api/app.config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

/**
 *  Wallet Module
 */
@Module({
  controllers: [ WalletController ],
  providers: [
    WalletService,
    ExplorersClient<IApiConfig>,
  ],
  imports: [ MetadataModule ],
})
export class WalletModule {}

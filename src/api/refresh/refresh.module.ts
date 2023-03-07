import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractsRepo } from '@shared/contracts';
import { TokensRepo } from '@shared/tokens';
import { DBModule } from '@shared/db';
import { MESSAGE_BUS_PROVIDER, clientFactory } from '@shared/microservices';
import { RefreshService } from './refresh.service';
import { RefreshController } from './refresh.controller';
import { IApiConfig } from '../app.config';

/**
 * Refresh Module
 * Refresh contract & tokens
 */
@Module({
  controllers: [ RefreshController ],
  providers: [
    {
      provide: MESSAGE_BUS_PROVIDER,
      useFactory: (configService: ConfigService<IApiConfig>) => clientFactory(configService, 'contractsQueue'),
      inject: [ ConfigService<IApiConfig> ],
    },
    RefreshService,
    ContractsRepo,
    TokensRepo,
  ],
  imports: [ DBModule ],
})
export class RefreshModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DBModule } from '@shared/db';
import { ContractsRepo } from '@shared/contracts';
import { EventsRepo } from '@shared/events';
import { TokensRepo } from '@shared/tokens';
import { Web3Provider } from '@shared/web3';
import { TokenProcessorController } from './token-processor.controller';
import { TokenProcessorService } from './token-processor.service';
import { TokenProcessorProvider } from './token-processor.provider';
import { MESSAGE_BUS_PROVIDER, clientFactory } from '@shared/microservices';
import { IIndexerConfig } from '../app.config';

@Module({
  imports: [ DBModule ],
  controllers: [
    TokenProcessorController,
  ],
  providers: [
    {
      provide: MESSAGE_BUS_PROVIDER,
      useFactory: (configService: ConfigService<IIndexerConfig>) => clientFactory(configService, 'contractsQueue'),
      inject: [ ConfigService<IIndexerConfig> ],
    },
    ContractsRepo,
    EventsRepo,
    TokensRepo,
    TokenProcessorService,
    TokenProcessorProvider,
    Web3Provider<IIndexerConfig>,
  ],
  exports: [ TokenProcessorProvider ],
})
export class TokenProcessorModule {}

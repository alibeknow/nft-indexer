import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MESSAGE_BUS_PROVIDER, clientFactory } from '@shared/microservices';
import { DBModule } from '@shared/db';
import { ContractsRepo } from '@shared/contracts';
import { TokensRepo } from '@shared/tokens';
import { Web3Provider } from '@shared/web3';
import { IContractReaderConfig } from '../app.config';
import { ContractReaderController } from './contract-reader.controller';
import { ContractReaderService } from './contract-reader.service';

@Module({
  imports: [ DBModule ],
  controllers: [ ContractReaderController ],
  providers: [
    {
      provide: MESSAGE_BUS_PROVIDER,
      useFactory: (configService: ConfigService<IContractReaderConfig>) => clientFactory(configService, 'metadataQueue'),
      inject: [ ConfigService<IContractReaderConfig> ],
    },
    ContractsRepo,
    TokensRepo,
    Web3Provider<IContractReaderConfig>,
    ContractReaderService,
  ],
})
export class ContractReaderModule {}

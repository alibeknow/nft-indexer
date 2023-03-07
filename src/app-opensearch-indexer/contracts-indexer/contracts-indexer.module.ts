import { Module } from '@nestjs/common';
import { ContractsRepo } from '@shared/contracts';
import { DBModule } from '@shared/db';
import { OpensearchModule } from '@shared/opensearch';
import { TokensRepo } from '@shared/tokens';
import { ContractsIndexerService } from './contracts-indexer.service';

@Module({
  controllers: [],
  providers: [
    ContractsIndexerService,
    TokensRepo,
    ContractsRepo,
  ],
  exports: [ ContractsIndexerService ],
  imports: [ DBModule, OpensearchModule ],
})
export class ContractsIndexerModule {}

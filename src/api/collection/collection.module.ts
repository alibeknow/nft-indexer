import { Module } from '@nestjs/common';
import { ContractsRepo } from '@shared/contracts';
import { DBModule } from '@shared/db';
import {
  CollectionControllerV0,
  CollectionControllerV1,
  CollectionControllerV2,
} from './collection.controller';
import { CollectionService } from './collection.service';
import { ConfigService } from '@nestjs/config';
import { IApiConfig } from '@api/app.config';

/**
 * Collection Module
 */
@Module({
  controllers: [ CollectionControllerV2, CollectionControllerV1, CollectionControllerV0 ],
  providers: [ CollectionService, ContractsRepo, ConfigService<IApiConfig> ],
  imports: [ DBModule ],
})
export class CollectionModule {}

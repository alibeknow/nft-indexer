import { Module } from '@nestjs/common';
import { DB, DBModule } from '@shared/db';
import { IMetadataRepo, METADATA_REPO_PROVIDER, MetadataRepoDB } from '@shared/metadata';
import { OpensearchModule } from '@shared/opensearch';
import { MetadataIndexerService } from './metadata-indexer.service';

@Module({
  controllers: [],
  providers: [
    {
      provide: METADATA_REPO_PROVIDER,
      inject: [ DB ],
      useFactory: (db: DB): IMetadataRepo => new MetadataRepoDB(db),
    },
    MetadataIndexerService,
  ],
  exports: [ MetadataIndexerService ],
  imports: [ DBModule, OpensearchModule ],
})
export class MetadataIndexerModule {}

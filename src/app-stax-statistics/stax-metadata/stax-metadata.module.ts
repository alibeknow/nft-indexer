import { OpensearchModule } from '@shared/opensearch';
import { Module } from '@nestjs/common';
import { StaxMetadataService } from './stax-metadata.service';
import { S3Provider } from '@shared/aws';

@Module({
  imports: [ OpensearchModule ],
  providers: [ StaxMetadataService, S3Provider ],
  exports: [ StaxMetadataService ],
})
export class StaxMetadataModule {}

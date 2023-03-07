import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';

/**
 * Owner Module
 */
@Module({
  controllers: [ OwnerController ],
  providers: [ OwnerService ],
})
export class OwnerModule {}

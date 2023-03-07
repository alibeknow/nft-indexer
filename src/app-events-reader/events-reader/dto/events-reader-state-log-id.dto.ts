import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { IEventsReaderStateLogId } from '../types';

export class EventsReaderStateLogIdDto implements IEventsReaderStateLogId {
  @ApiProperty({
    name: 'id',
    type: String,
    required: false,
    description: '',
  })
  @IsOptional()
  @IsUUID()
  public id?: string;

  @ApiProperty({
    name: 'inProgress',
    type: Boolean,
    required: false,
    description: 'Current state of indexer',
  })
  @IsOptional()
  @IsBoolean()
  public inProgress?: boolean;
}

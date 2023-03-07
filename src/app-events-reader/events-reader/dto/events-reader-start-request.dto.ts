import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { EventIndexType } from '@shared/events';

import { IEventsReaderStart } from '../types';

export class EventsReaderStartRequestDto implements IEventsReaderStart {
  @ApiProperty({
    name: 'blockNumberFrom',
    type: Number,
    required: false,
    description: 'From block number, if undefined - start from beginning',
  })
  @IsOptional()
  @IsInt()
  public blockNumberFrom?: number;

  @ApiProperty({
    name: 'blockNumberTo',
    type: Number,
    required: false,
    description: 'To block number, if undefined - live mode indexing',
  })
  @IsOptional()
  @IsInt()
  public blockNumberTo?: number;

  @ApiProperty({
    name: 'type',
    enum: EventIndexType,
    enumName: 'EventIndexType',
    type: EventIndexType,
    required: false,
    description: 'Events reader mode: index only new blocks or reindex whole range',
  })
  @IsOptional()
  @IsEnum(EventIndexType)
  public type?: EventIndexType;
}

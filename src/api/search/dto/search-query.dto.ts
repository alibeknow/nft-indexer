import { Blockchain } from '@shared/blockchain';
import { Split } from '@miaooo/class-transformer-split';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OpensearchSearchFields } from '@shared/opensearch';
import { Transform } from 'class-transformer';

function toInt(value?: string)  {
  if (!value) {
    return value;
  }

  const newValue: number = Number.parseInt(value, 10);

  if (Number.isNaN(newValue)) {
    return value;
  }

  return newValue;
}

export class SearchQueryDto {
  @ApiProperty({
    name: 'q',
    type: String,
    required: true,
    description: 'The search string parameter',
  })
  @IsNotEmpty()
  @IsString()
  public q!: string;

  @ApiProperty({
    name: 'filter',
    enum: OpensearchSearchFields,
    enumName: 'OpensearchSearchFields',
    type: [ OpensearchSearchFields ],
    isArray: true,
    required: true,
    description: 'The search filter key parameter',
  })
  @IsNotEmpty()
  @IsArray()
  @Split(',')
  public filter!: OpensearchSearchFields[];

  @ApiProperty({
    name: 'chain',
    enum: Blockchain,
    enumName: 'Blockchain',
    type: Blockchain,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(Blockchain)
  public chain?: Blockchain;

  @Transform(({ value }) => toInt(value))
  @ApiProperty({
    name: 'from',
    type: Number,
    required: false,
    description: 'Pagination',
  })
  @IsOptional()
  @IsInt()
  public from?: number;

  @Transform(({ value }) => toInt(value))
  @ApiProperty({
    name: 'size',
    type: Number,
    required: false,
    description: 'Pagination',
  })
  @IsOptional()
  @IsInt()
  public size?: number;
}

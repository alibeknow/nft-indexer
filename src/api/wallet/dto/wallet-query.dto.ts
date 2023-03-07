import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class WalletQueryDto {

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @IsPositive()
  public readonly limit: number = 50;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @IsPositive()
  public readonly page: number = 1;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  public readonly contractAddress!: string;
}

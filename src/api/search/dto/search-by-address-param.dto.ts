import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchByAddressParamDto {
  @ApiProperty({
    name: 'address',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public readonly address!: string;
}

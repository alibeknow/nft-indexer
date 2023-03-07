import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SearchQueryDto } from './search-query.dto';

export class SearchQueryWithAddressDto extends SearchQueryDto {
  @ApiProperty({
    name: 'contractAddress',
    type: String,
    required: true,
    description: 'Address of the contract on which the search will be made',
  })
  @IsNotEmpty()
  @IsString()
  public contractAddress!: string;
}


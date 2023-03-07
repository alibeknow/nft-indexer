import { Split } from '@miaooo/class-transformer-split';
import { IsArray, IsNotEmpty } from 'class-validator';

export class NFTsMetadataQueryDto {

  @IsNotEmpty()
  @IsArray()
  @Split(',')
  public readonly tokenIds: string[] | undefined;
}

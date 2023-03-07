import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '@shared/blockchain';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class NFTsMetadataParamDto {
  @ApiProperty({
    name: 'chainName',
    enum: Blockchain,
    enumName: 'Blockchain',
    type: Blockchain,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Blockchain)
  public readonly chainName!: Blockchain;

  @ApiProperty({
    name: 'contractAddress',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public readonly contractAddress!: string;
}

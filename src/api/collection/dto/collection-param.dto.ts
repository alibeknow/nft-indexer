import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '@shared/blockchain';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CollectionParamDto {
  @ApiProperty({
    name: 'contractId',
    type: String,
    description: 'Address of the contract in hex format',
  })
  @IsNotEmpty()
  @IsString()
  public readonly contractId!: string;

  @ApiProperty({
    name: 'chainName',
    enum: Blockchain,
    enumName: 'Blockchain',
    type: Blockchain,
    description: 'The chain to query',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Blockchain)
  public readonly chainName!: Blockchain;
}

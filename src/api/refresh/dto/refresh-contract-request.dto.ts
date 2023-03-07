import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '@shared/blockchain';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RefreshContractParams } from '../types';

export class RefreshContractRequest implements RefreshContractParams {
  @ApiProperty({
    description: 'The chain to query',
    enum: Blockchain,
    enumName: 'Blockchain',
    name: 'chainName',
    type: Blockchain,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Blockchain)
  public readonly chainName!: Blockchain;

  @ApiProperty({
    description: 'Address of the contract in hex format',
    name: 'contractAddress',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public readonly contractAddress!: string;
}

import { Blockchain } from '@shared/blockchain';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class WalletParamDto {

  @ApiProperty({
    name: 'chainName',
    enum: Blockchain,
    enumName: 'Blockchain',
    type: Blockchain,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Blockchain)
  public chainName!: Blockchain;

  @ApiProperty({
    name: 'address',
    type: String,
  })
  @IsNotEmpty()
  @IsEthereumAddress()
  public address!: string;
}

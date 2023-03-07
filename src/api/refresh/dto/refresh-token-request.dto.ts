import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RefreshContractRequest } from './refresh-contract-request.dto';
import { RefreshTokenParams } from '../types';

export class RefreshTokenRequest extends RefreshContractRequest implements RefreshTokenParams {
  @ApiProperty({
    name: 'tokenId',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public readonly tokenId!: string;
}

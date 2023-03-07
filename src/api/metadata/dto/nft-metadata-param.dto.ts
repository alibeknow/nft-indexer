import { HttpException, HttpStatus, PipeTransform } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '@shared/blockchain';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ethers } from 'ethers';

export class TokenConvertedPipe implements PipeTransform {
  transform(param: Record<string, any>): NFTMetadataParamDto {
    const result = new NFTMetadataParamDto();

    result.chainName = param.chainName;
    result.contractAddress = param.contractAddress;

    try {
      result.tokenId = ethers.utils.hexlify(BigInt(param.tokenId));
    } catch (error) {
      throw new HttpException(
        `Please make sure that '${param.tokenId}' is a valid hex or decimal tokenID`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }
}

export class NFTMetadataParamDto {
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
    name: 'contractAddress',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public contractAddress!: string;

  @ApiProperty({
    name: 'tokenId',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public tokenId!: string;
}

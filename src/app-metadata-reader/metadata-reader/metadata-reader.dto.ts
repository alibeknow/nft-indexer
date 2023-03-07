import { IsEnum, IsNumber, IsString } from 'class-validator';
import { TokenStandard } from '@shared/tokens';
import { Blockchain } from '@shared/blockchain';

export class ReadMetadataMsgDto {
  @IsEnum(Blockchain)
  public readonly blockchainName!: Blockchain;

  @IsNumber()
  public readonly blockNumber!: number;

  @IsString()
  public readonly contractAddress!: string;

  @IsString()
  public readonly contractName!: string;

  @IsEnum(TokenStandard)
  public readonly contractType!: TokenStandard;

  @IsString()
  public readonly tokenId!: string;

  @IsString()
  public readonly tokenUri!: string;
}

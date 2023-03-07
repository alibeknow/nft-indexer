import { IsEnum, IsNumber, IsString } from 'class-validator';
import { TokenStandard } from '@shared/tokens';
import { Blockchain } from '@shared/blockchain';

export class ReadContractMsgDto {
  @IsEnum(Blockchain)
  public readonly blockchainName!: Blockchain;

  @IsNumber()
  public readonly blockNumber!: number;

  @IsString()
  public readonly contractAddress!: string;

  @IsEnum(TokenStandard)
  public readonly contractType!: TokenStandard;
}

export class ReadTokenMsgDto extends ReadContractMsgDto {
  @IsString()
  public readonly tokenId!: string;
}

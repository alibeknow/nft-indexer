import { TokenStandard } from '@shared/tokens';
import { Blockchain } from '@shared/blockchain';

export interface ContractEventData {
  blockchainName: Blockchain;
  blockNumber: number;
  contractAddress: string;
  contractType: TokenStandard;
}

export interface TokenEventData extends ContractEventData {
  tokenId: string;
}

export interface MetadataEventData extends TokenEventData {
  tokenUri: string;
}

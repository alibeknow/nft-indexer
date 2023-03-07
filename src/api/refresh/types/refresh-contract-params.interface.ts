import { Blockchain } from '@shared/blockchain';

export interface RefreshContractParams {
  chainName: Blockchain;
  contractAddress: string;
}

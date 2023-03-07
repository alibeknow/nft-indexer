import { RefreshContractParams } from './refresh-contract-params.interface';

export interface RefreshTokenParams extends RefreshContractParams {
  tokenId: string;
}

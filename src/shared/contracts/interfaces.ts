import { TokenStandard } from '@shared/tokens';

export interface IContractSearchResult {
  contract_address: string;
  contract_name: string;
  contract_description: string;
  verified: boolean;
  number_of_tokens: number;
  contract_type: TokenStandard;
  synced_at?: Date | null;
  created_at?: Date | null;
  collection_image?: string;
}

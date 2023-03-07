import { Blockchain } from '@shared/blockchain';
import { IOpensearchSearchWhereFieldParams } from '@shared/opensearch';

export const STREAM_OPTIONS = 'STREAM_OPTIONS';

export const OPENSEARCH_FIELD_PARAMS: IOpensearchSearchWhereFieldParams = {
  fieldName: 'metadata.ledger_metadata.ledger_stax_image',
  chain: Blockchain.ETH,
  size: 10000,
};

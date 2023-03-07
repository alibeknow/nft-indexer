import { ReaderInterface } from './interfaces';
import { BASE64_ENCODING, DATA_URL_PREFIX, JSON_MEDIA_TYPE } from './constants';

/**
 * Read onchain data
 *
 * @example
 * onChainReader('data:application/json;base64,eyJuYW1lIjoiT3Ji...');
 *
 * @param {string} tokenUri metadata presented in tokenUri variable
 * @returns {string} metadata
 */
export const onChainReader: ReaderInterface = function(tokenUri: string): string {
  const [ head, base64 ] = tokenUri.split(',');
  const headWithoutDataPrefix = head.replace(DATA_URL_PREFIX, '');
  const [ mediaType, encoding ] = headWithoutDataPrefix.split(';');

  if(encoding !== BASE64_ENCODING) {
    throw new Error(`Bad encoding. Only ${BASE64_ENCODING} is supported by on-chain metadata reader`);
  }

  if(mediaType !== JSON_MEDIA_TYPE) {
    throw new Error(`Bad media type. Only ${JSON_MEDIA_TYPE} is supported by on-chain metadata reader`);
  }

  const buffer = Buffer.from(base64, BASE64_ENCODING);

  return buffer.toString();
};

import axios from 'axios';

export interface ContentHeaders {
  type: string;
  length: number | null;
}

/**
 * Read Content Headers of given uri
 *
 * @example
 * // Returns {type: 'application/json', length: 12345}
 * await readContentHeaders('https://gateway/ipfs/QmYGPih59j1BDXPk...nsXjGFj7')
 *
 * @param {string} tokenUri https/http link
 * @returns {Promise<ContentHeaders>} Content Headers
 */
export async function readContentHeaders(tokenUri: string): Promise<ContentHeaders> {
  const contentHeadInfo = await axios.head(tokenUri, { proxy: false });
  const contentType = contentHeadInfo.headers['content-type'];
  const contentLength = contentHeadInfo.headers['content-length'];
  const checkedLength = contentLength ? parseInt(contentLength) : null;

  return {
    type: contentType,
    length: checkedLength,
  };
}

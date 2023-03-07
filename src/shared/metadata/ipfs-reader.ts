import path from 'path';
import { IPFS, create } from 'ipfs-core';
import { create as createHttp } from 'ipfs-http-client';
import { IPFS_GATEWAY_HOST, IPFS_GATEWAY_PORT } from './constants';
import { ReaderInterface } from './interfaces';
import { HttpReader } from './http-reader';

/**
 * Create IPFS Core API instance
 * @returns {Promise<IPFS>} IPFS Core API instance
 */
export async function createIPFS(): Promise<IPFS> {
  const ipfs = await create({
    silent: true,
    repo: `${ path.resolve(__dirname)}/.ipfs`,
    start: true,
    config: {
      Bootstrap: [],
    },
  });

  return ipfs;
}

/**
 * Asynchronously read metadata on ipfs storage
 *
 * @example <caption> Read metadata using ipfs link </caption>
 * await ipfsReader('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json');
 *
 * @param {string} tokenUri ipfs uri
 * @returns {Promise<string>} metadata
 */
export const ipfsReader: ReaderInterface = async function(tokenUri: string): Promise<string> {
  const ipfs = await createIPFS();
  const ipfsPath = convertTokenUriToIpfsPath(tokenUri);

  const result = await ipfs.cat(ipfsPath);

  let content = '';
  for await (const buf of result) {
    content += buf.toString();
  }

  return content;
};

/**
 * Asynchronously read metadata on ipfs storage via ipfs http api
 *
 * @example <caption> Read metadata using ipfs link </caption>
 * await ipfsHttpReader('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json');
 *
 * @param {string} tokenUri ipfs uri
 * @returns {Promise<string>} metadata
 */
export const ipfsHttpReader: ReaderInterface = async function(tokenUri: string): Promise<string> {
  const ipfsPath = convertTokenUriToIpfsPath(tokenUri);

  const ipfs = createHttp({
    host: IPFS_GATEWAY_HOST,
    port: IPFS_GATEWAY_PORT,
  });

  const result = await ipfs.cat(ipfsPath);
  let content = '';
  for await (const buf of result) {
    content += buf.toString();
  }

  return content;
};

/**
 * Asynchronously read metadata on ipfs storage via ipfs gateway
 *
 * @example <caption> Read metadata using ipfs link </caption>
 * await ipfsGatewayHttpReader('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json');
 *
 * @param {string} tokenUri ipfs uri
 * @param {number} requestTimeout (optional) request timeout (in milliseconds)
 * @returns {Promise<string>} metadata
 */
export const ipfsGatewayHttpReader: ReaderInterface = async function(tokenUri: string, requestTimeout?: number): Promise<string> {
  const ipfsGatewayUri = convertTokenUriToIpfsGatewayUri(tokenUri);

  return new HttpReader(0, undefined, requestTimeout).read(ipfsGatewayUri);
};

/**
 * Convert token uri to ipfs path
 *
 * @example
 * // Returns QmYGPih59j1BDXPk...nsXjGFj7/1088.json
 * convertTokenUriToIpfsPath('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json');
 *
 * @param {string} tokenUri token ipfs uri
 * @returns {string} ipfs path
 */
export function convertTokenUriToIpfsPath(tokenUri: string): string {
  return tokenUri.replace(/ipfs:\/\//, '');
}

/**
 * Convert token uri to ipfs.io/ipfs gateway
 *
 * @example
 * // Returns https://ipfs.io/ipfs/QmYGPih59j1BDXPk...nsXjGFj7/1088.json
 * convertTokenUriToIpfsGatewayUri('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json');
 *
 * @param {string} tokenUri ipfs uri
 * @returns {string} ipfs.io gateway uri
 */
export function convertTokenUriToIpfsGatewayUri(tokenUri: string): string {
  return tokenUri.replace(/^ipfs:\/\/(ipfs\/)?/, 'https://ipfs.io/ipfs/');
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import IPFSGatewayTools from '@pinata/ipfs-gateway-tools/dist/node';

export type PinataConvertedURL= {
  ok: boolean;
  url: string;
};

/**
 * Convert uri to Pinata Url if possible
 *
 * @example
 * // Returns {ok: true, url: https://mypinata.cloud/ipfs/QmYGPih59j1BDXPk...nsXjGFj7/1088.json}
 * convertIPFStoPinataURL('ipfs://QmYGPih59j1BDXPk...nsXjGFj7/1088.json', 'https://mypinata.cloud');
 *
 * @param {string} sourceUrl uri for converting
 * @param {string} desiredGateway desired gateway
 * @returns {PinataConvertedURL} Result of conversion
 */
export function convertIPFStoPinataURL(sourceUrl: string, desiredGateway: string): PinataConvertedURL {
  const gatewayTools = new IPFSGatewayTools();
  const urlContainsCID =  gatewayTools.containsCID(sourceUrl).containsCid;

  if (!urlContainsCID) {
    return { ok: false, url: sourceUrl };
  }
  try {
    const convertedGatewayUrl = gatewayTools.convertToDesiredGateway(
      sourceUrl,
      desiredGateway,
    ) as string;

    return { ok: true, url: convertedGatewayUrl };
  } catch (error) {
    return { ok: false, url: sourceUrl };
  }

}


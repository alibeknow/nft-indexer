import { convertTokenUriToIpfsGatewayUri, convertTokenUriToIpfsPath } from '@shared/metadata';

describe('ipfs-metadata-reader', () => {

  describe('[convertTokenUriToIpfsPath] function', () => {
    it('should convert tokenUri to ipfs path', () => {
      expect(
        convertTokenUriToIpfsPath('ipfs://QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json'),
      ).toBe('QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json');
      expect(
        convertTokenUriToIpfsPath('ipfs://QmRVQaLGFrgDVSUzrocb76mdaXnxsSPKxH6QsWYgHFLsdaSS2jrW/test.json'),
      ).toBe('QmRVQaLGFrgDVSUzrocb76mdaXnxsSPKxH6QsWYgHFLsdaSS2jrW/test.json');
      expect(
        convertTokenUriToIpfsPath('ipfs://QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/95623.json'),
      ).toBe('QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/95623.json');
      expect(
        convertTokenUriToIpfsPath('ipfs://QmZpV3aBaBHPZNnwdoqCxxchBP8y1qW9eb79oQkJ5SoPir/9745'),
      ).toBe('QmZpV3aBaBHPZNnwdoqCxxchBP8y1qW9eb79oQkJ5SoPir/9745');
    });
  });

  describe('[convertTokenUriToIpfsGatewayUri] function', () => {
    it('should convert tokenUri to ipfs.io gateway uri', () => {
      expect(
        convertTokenUriToIpfsGatewayUri('ipfs://QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json'),
      ).toBe(
        'https://ipfs.io/ipfs/QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json',
      );
      expect(
        convertTokenUriToIpfsGatewayUri('ipfs://QmRVQaLGFrgDVSUzrocb76mdaXnxsSPKxH6QsWYgHFLsdaSS2jrW/test.json'),
      ).toBe(
        'https://ipfs.io/ipfs/QmRVQaLGFrgDVSUzrocb76mdaXnxsSPKxH6QsWYgHFLsdaSS2jrW/test.json',
      );
      expect(
        convertTokenUriToIpfsGatewayUri('ipfs://QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/95623.json'),
      ).toBe(
        'https://ipfs.io/ipfs/QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/95623.json',
      );
      expect(
        convertTokenUriToIpfsGatewayUri('ipfs://QmZpV3aBaBHPZNnwdoqCxxchBP8y1qW9eb79oQkJ5SoPir/9745'),
      ).toBe(
        'https://ipfs.io/ipfs/QmZpV3aBaBHPZNnwdoqCxxchBP8y1qW9eb79oQkJ5SoPir/9745',
      );
    });
  });
});

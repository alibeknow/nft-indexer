import { convertIPFStoPinataURL } from '@shared/metadata';

describe('pinata-metadata-reader', () => {
  describe('[convertTokenUriToPinataGatewayUri] function', () => {
    const desiredGatewayPrefix = 'https://gateway.pinata.cloud';

    it('should convert tokenUri to pinata Gateway path', () => {
      expect(
        convertIPFStoPinataURL('ipfs://QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json', desiredGatewayPrefix),
      ).toEqual({ ok: true, url: 'https://gateway.pinata.cloud/ipfs/QmRVQaL9DrgDVSUzrocb76mdaXnxsSPKxH6QsWYgKq2jrW/metadata.json' });
      expect(
        convertIPFStoPinataURL('ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/cat.jpg', desiredGatewayPrefix),
      ).toEqual({ ok: true, url: 'https://gateway.pinata.cloud/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/cat.jpg' });
      expect(
        convertIPFStoPinataURL('ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/95623.json', desiredGatewayPrefix),
      ).toEqual({ ok: true, url: 'https://gateway.pinata.cloud/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/95623.json' });
      expect(
        convertIPFStoPinataURL('ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/9745', desiredGatewayPrefix),
      ).toEqual({ ok: true, url: 'https://gateway.pinata.cloud/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/9745' });
    });

    it('should return url, if url does not contain CID', () => {
      expect(
        convertIPFStoPinataURL('ipfs://asdflksjfslkd', desiredGatewayPrefix),
      ).toEqual({ ok: false, url: 'ipfs://asdflksjfslkd' });
      expect(
        convertIPFStoPinataURL('https://translate.google.com/', desiredGatewayPrefix),
      ).toEqual({ ok: false, url: 'https://translate.google.com/' });
      expect(
        convertIPFStoPinataURL('s3://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/9745', desiredGatewayPrefix),
      ).toEqual({ ok: false, url: 's3://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ/9745' });
    });
  });
});

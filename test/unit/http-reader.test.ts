import { HttpReader } from '@shared/metadata';
import axios from 'axios';
import { axiosGetResponse } from './fixtures/axios-get-reponse';

jest.setTimeout(40000);
jest.mock('axios');


class RateLimitError extends Error {
  public response = { status: 429 };
}

describe('HttpReader', () => {

  describe('[read] method', () => {
    it('should not apply retries if retries argument is 0', async () => {
      jest.spyOn(axios, 'get').mockImplementation(() => Promise.resolve(axiosGetResponse));

      const httpReader = new HttpReader();
      const tokenUri = 'https://ipfs.io/ipfs/QmapFPdNCAHMSKKcCLAfq3j9VGXJbvewwaC65tTkHrrL4T/265.json';
      const result = await httpReader.read(tokenUri);

      expect(axios.get).toHaveBeenNthCalledWith(1, tokenUri, { proxy: false, transformResponse: [], timeout: 0 });
      expect(result).toMatchSnapshot();
    });

    it('should not apply retries if retries argument is 0 and an error happened', async () => {
      const fakeErrorMsg = 'Some unexpected error...';

      jest.spyOn(axios, 'get').mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            reject(new Error(fakeErrorMsg));
          });
        });
      });

      const httpReader = new HttpReader();
      const tokenUri = 'https://ipfs.io/ipfs/QmapFPdNCAHMSKKcCLAfq3j9VGXJbvewwaC65tTkHrrL4T/265.json';

      await expect(async () => {
        await httpReader.read(tokenUri);
      }).rejects.toThrow(fakeErrorMsg);
      expect(axios.get).toHaveBeenNthCalledWith(1, tokenUri, { proxy: false, transformResponse: [], timeout: 0 });
    });

    it('should apply retries in case of errors and if retries argument is > 0', async () => {
      let counter = 0;
      jest.spyOn(axios, 'get').mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            if (counter < 3) {
              return reject(new RateLimitError('Rate limit error...'));
            } else {
              return resolve(axiosGetResponse);
            }
          });
          counter++;
        });
      });

      const httpReader = new HttpReader(3);
      const tokenUri = 'https://ipfs.io/ipfs/QmapFPdNCAHMSKKcCLAfq3j9VGXJbvewwaC65tTkHrrL4T/265.json';
      const result = await httpReader.read(tokenUri);

      expect(axios.get).toHaveBeenNthCalledWith(1, tokenUri, { proxy: false, transformResponse: [], timeout: 0 });
      expect(result).toMatchSnapshot();
    });
  });
});

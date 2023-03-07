import { IOpenseaConfig, OpenseaClient } from '@shared/opensea';
import axios from 'axios';
import { openseaClientCollectionImageResponse } from './fixtures';

describe('OpenseaClient', () => {
  let openseaClient: OpenseaClient;
  let config: IOpenseaConfig;

  beforeAll(() => {
    config = {
      uri: 'http://opensea/',
      api_key: '123321',
    };

    openseaClient = new OpenseaClient(config);
  });

  describe('[getOpenseaCollectionImageUrl] method', () => {
    let attempt = 0;
    let result: Awaited<ReturnType<OpenseaClient['getOpenseaCollectionImageUrl']>> = '';
    const maxAttempts = 3;

    beforeEach(async () => {
      attempt = 0;

      jest.spyOn(axios, 'get').mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            if (attempt < maxAttempts) {
              attempt++;

              return reject('uh oh...');
            }

            return resolve({ data: openseaClientCollectionImageResponse });
          });
        });
      });

      result = await openseaClient.getOpenseaCollectionImageUrl('https://image');
    });

    it(`should attempt to fetch the image ${maxAttempts} times`, () => expect(attempt).toEqual(maxAttempts));

    it('should return the collection image url', () =>
      expect(result).toEqual(openseaClientCollectionImageResponse.collection.featured_image_url),
    );
  });
});

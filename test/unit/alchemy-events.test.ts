import { BigNumber, ethers } from 'ethers';
import { ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD, ALCHEMY_GET_EVENTS_RETRIES, requestTransferEvents } from '@shared/alchemy';
import { ZERO_FROM_ADDRESS } from '@shared/nfts';

jest.setTimeout(40000);

describe('Alchemy transfer events', () => {
  describe('[requestTransferEvents] function', () => {
    it('should apply retries in case of errors', async () => {
      const blockNumberFrom = 0;
      const blockNumberTo = 1;
      const nodeAddress = 'node-address';

      const fakeResults = {
        transfers: [
          {
            blockNum: 0,
            hash: 'some-hash-1',
            from: 'from',
            to: 'to',
            erc721TokenId: 'some-token-id-1',
            erc1155Metadata: [],
            rawContract: {},
          },
          {
            blockNum: 1,
            hash: 'some-hash-2',
            from: 'from',
            to: 'to',
            erc721TokenId: 'some-token-id-2',
            erc1155Metadata: [],
            rawContract: {},
          },
        ],
        pageKey: 'fake-page-key',
      };
      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);

      let counter = 0;
      jest.spyOn(provider, 'send').mockImplementation((method) => {
        if(method === ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD) {
          counter++;

          return new Promise((resolve, reject) => {
            setImmediate(() => {
              if(counter < 3) {
                return reject(new Error('Some unexpected error...'));
              } else {
                return resolve(fakeResults);
              }
            });
          });
        }

        return Promise.resolve();
      });

      const results = await requestTransferEvents(provider, blockNumberFrom, blockNumberTo);
      expect(provider.send).toHaveBeenNthCalledWith(4, ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD, [ {
        fromBlock: BigNumber.from(blockNumberFrom).toHexString(),
        toBlock: BigNumber.from(blockNumberTo).toHexString(),
        fromAddress: ZERO_FROM_ADDRESS,
        category: [
          'erc721',
          'erc1155',
        ],
      } ]);
      expect(results).toStrictEqual(fakeResults);

      jest.spyOn(provider, 'send').mockReset();
    });

    it('should throw an error if number of retries is exceeded', async () => {
      const blockNumberFrom = 0;
      const blockNumberTo = 1;
      const nodeAddress = 'node-address';
      const fakeErrorMsg = 'Some unexpected error...';

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);

      jest.spyOn(provider, 'send').mockImplementation(async (method: string) => {
        if(method === ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD) {
          return new Promise((resolve, reject) => {
            setImmediate(() => {
              reject(new Error(fakeErrorMsg));
            });
          });
        }

        return Promise.resolve();
      });

      await expect(async () => {
        await requestTransferEvents(provider, blockNumberFrom, blockNumberTo);
      }).rejects.toThrow(fakeErrorMsg);

      expect(provider.send).toHaveBeenNthCalledWith(ALCHEMY_GET_EVENTS_RETRIES, ALCHEMY_GET_ASSET_TRANSFERS_JRPC_METHOD, [ {
        fromBlock: BigNumber.from(blockNumberFrom).toHexString(),
        toBlock: BigNumber.from(blockNumberTo).toHexString(),
        fromAddress: ZERO_FROM_ADDRESS,
        category: [
          'erc721',
          'erc1155',
        ],
      } ]);

      jest.spyOn(provider, 'send').mockReset();
    });
  });
});

import { ethers } from 'ethers';
import { ETH_NODE_GET_BLOCK_RETRIES, getBlock, getLatestBlock } from '@shared/ethnode';

jest.setTimeout(40000);

describe('Block tests', () => {
  describe('[getLatestBlock] function', () => {
    it('should apply retries in case of errors', async () => {
      const fakeBlockNumberResponse = 666;
      const nodeAddress = 'node-address';
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);

      let counter = 0;
      jest.spyOn(provider, 'getBlockNumber').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            if(counter < 3) {
              return reject(new Error('Some unexpected error...'));
            } else {
              return resolve(fakeBlockNumberResponse);
            }
          });
          counter++;
        });
      });

      const result = await getLatestBlock(provider);

      expect(provider.getBlockNumber).toHaveBeenCalledTimes(3);
      expect(result).toStrictEqual(fakeBlockNumberResponse);

      jest.spyOn(provider, 'getBlockNumber').mockReset();
    });

    it('should throw an error if number of retries is exceeded', async () => {
      const fakeErrorMsg = 'Some unexpected error...';
      const nodeAddress = 'node-address';
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);


      jest.spyOn(provider, 'getBlockNumber').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            reject(new Error(fakeErrorMsg));
          });
        });
      });

      await expect(async () => {
        await getLatestBlock(provider);
      }).rejects.toThrow(fakeErrorMsg);

      expect(provider.getBlockNumber).toHaveBeenCalledTimes(ETH_NODE_GET_BLOCK_RETRIES + 1);

      jest.spyOn(provider, 'getBlockNumber').mockReset();
    });

    it('should return correct result from the first attempt if there are no errors', async () => {
      const fakeBlockNumberResponse = 777;
      const nodeAddress = 'node-address';
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);

      jest.spyOn(provider, 'getBlockNumber').mockImplementation(async () => {
        return new Promise((resolve) => {
          setImmediate(() => {
            return resolve(fakeBlockNumberResponse);
          });
        });
      });

      const result = await getLatestBlock(provider);

      expect(provider.getBlockNumber).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(fakeBlockNumberResponse);

      jest.spyOn(provider, 'getBlockNumber').mockReset();
    });
  });

  describe('[getBlock] function', () => {
    it('should apply retries in case of errors', async () => {
      const nodeAddress = 'node-address';
      const expectedResult = { some: 'data' };
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);

      let counter = 0;
      jest.spyOn(provider, 'getBlock').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            if(counter < 3) {
              return reject(new Error('Some unexpected error...'));
            } else {
              return resolve(expectedResult as unknown as ethers.providers.Block);
            }
          });
          counter++;
        });
      });

      const result = await getBlock(provider, 12313123);

      expect(provider.getBlock).toHaveBeenCalledTimes(3);
      expect(result).toStrictEqual(expectedResult);

      jest.spyOn(provider, 'getBlock').mockReset();
    });

    it('should throw an error if number of retries is exceeded', async () => {
      const fakeErrorMsg = 'Some unexpected error...';
      const nodeAddress = 'node-address';
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);

      jest.spyOn(provider, 'getBlock').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            reject(new Error(fakeErrorMsg));
          });
        });
      });

      await expect(async () => {
        await getBlock(provider, 123);
      }).rejects.toThrow(fakeErrorMsg);

      expect(provider.getBlock).toHaveBeenCalledTimes(ETH_NODE_GET_BLOCK_RETRIES + 1);

      jest.spyOn(provider, 'getBlock').mockReset();
    });

    it('should return correct result from the first attempt if there are no errors', async () => {
      const nodeAddress = 'node-address';
      const expectedResult = { some: 'data' };
      const provider = new ethers.providers.StaticJsonRpcProvider(nodeAddress);

      jest.spyOn(provider, 'getBlock').mockImplementation(async () => {
        return new Promise((resolve) => {
          setImmediate(() => {
            return resolve(expectedResult  as unknown as ethers.providers.Block);
          });
        });
      });

      const result = await getBlock(provider, 123);

      expect(provider.getBlock).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(expectedResult);

      jest.spyOn(provider, 'getBlock').mockReset();
    });
  });
});

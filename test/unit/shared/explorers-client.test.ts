import axios from 'axios';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { ExplorersClient, IExplorersClientConfig } from '@shared/explorers-client';
import { IApiConfig } from '@api/app.config';
import { Blockchain } from '@shared/blockchain';
import { explorersApiAxiosResponse1, explorersApiAxiosResponse2, explorersApiResponse } from './fixtures';

describe('ExplorersClient', () => {
  let explorersClient: ExplorersClient<IApiConfig>;
  let config: ConfigService<IApiConfig>;

  beforeAll(() => {
    config = {
      get: () => {
        return {
          explorersApi: 'http://explorers.api/blockchain/v4',
        } as IExplorersClientConfig;
      },
    } as unknown as ConfigService<IApiConfig>;

    explorersClient = new ExplorersClient(config);
  });

  describe('[fetchWalletEvents] method', () => {

    it('should return wallet events', async () => {
      const chainName = Blockchain.ETH;
      const walletAddress = '0x753F10598C026E73182CA74ED33DE05974b9f083';
      const eventSignature = ethers.utils.id('Transfer(address,address,uint256)');

      // @ts-ignore
      jest.spyOn(explorersClient, 'request').mockImplementationOnce(() => {
        return Promise.resolve(explorersApiResponse as unknown);
      });

      const result = await explorersClient.fetchWalletEvents(
        chainName, walletAddress, eventSignature,
      );

      expect(explorersClient.request).toHaveBeenNthCalledWith(1, `${chainName}/address/${walletAddress}/events/${eventSignature}`);
      expect(result).toEqual(explorersApiResponse);
    });
  });

  describe('[request] method', () => {
    it('should return list of results from explorers API', async () => {
      const chainName = Blockchain.ETH;
      const walletAddress = '0x753F10598C026E73182CA74ED33DE05974b9f083';
      const eventSignature = ethers.utils.id('Transfer(address,address,uint256)');

      jest.spyOn(axios, 'get').mockImplementation((url: string) => {
        return new Promise((resolve) => {
          setImmediate(() => {
            if(url === `${config.get('explorersClient').explorersApi}/${chainName}/address/${walletAddress}/events/${eventSignature}`) {
              return resolve(explorersApiAxiosResponse1);
            } else {
              return resolve(explorersApiAxiosResponse2);
            }
          });
        });
      });

      const results = await explorersClient.request(`${chainName}/address/${walletAddress}/events/${eventSignature}`);

      expect(results).toHaveLength(6);
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(results).toMatchSnapshot();
    });
  });
});

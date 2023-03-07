import { ethers } from 'ethers';
import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { ALCHEMY_HTTP_URL, IAlchemyConfig } from '@shared/alchemy';
import {
  doesContractSupportERC1155,
  doesContractSupportERC721,
  getContractInstance,
} from '@shared/nfts';

jest.setTimeout(30000);

describe('NFT Contract Checker', () => {
  let nodeAddress: string;
  let provider: ethers.providers.JsonRpcProvider;

  beforeAll(async () => {
    const appConfig: IBaseConfig = getBaseConfig();
    const alchemyConfig: IAlchemyConfig = appConfig.alchemy;

    nodeAddress = `${ALCHEMY_HTTP_URL}/${alchemyConfig.alchemyApiKey}`;
    provider = new ethers.providers.JsonRpcProvider(nodeAddress);
  });

  describe('[doesContractSupportERC721] function', () => {
    it('should return true if a contract supports ERC-721 interface', async () => {
      const contract1 = getContractInstance('0x7d24bb9bB72a14Aee2d22092240182BDbBD0C5D6', provider); //ERC-721
      const result1 = await doesContractSupportERC721(contract1);

      const contract2 = getContractInstance('0xeE467844905022D2A6CC1dA7A0B555608faae751', provider); //ERC-721
      const result2 = await doesContractSupportERC721(contract2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false if a contract doesn\'t support ERC-721', async () => {
      const contract = getContractInstance('0xFEc757b1f6659E6207632a964244B0943ccD59f4', provider);
      const result = await doesContractSupportERC721(contract);

      expect(result).toBe(false);
    });

    it('should return false if a contract supports ERC-1155', async () => {
      const contract = getContractInstance('0x76be3b62873462d2142405439777e971754e8e77', provider); //ERC-1155
      const result = await doesContractSupportERC721(contract);

      expect(result).toBe(false);
    });
  });

  describe('[doesContractSupportERC1155] function', () => {
    it('should return true if a contract supports ERC-1155 interface', async () => {
      const contract1 = getContractInstance('0x76be3b62873462d2142405439777e971754e8e77', provider); //ERC-1155
      const result1 = await doesContractSupportERC1155(contract1);

      const contract2 = getContractInstance('0xda660f57b9df79e1a4b56156427dbb6862eb715e', provider); //ERC-1155
      const result2 = await doesContractSupportERC1155(contract2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false if a contract doesn\'t support ERC-1155', async () => {
      const contract = getContractInstance('0xeE467844905022D2A6CC1dA7A0B555608faae751', provider); //ERC-721
      const result = await doesContractSupportERC1155(contract);

      expect(result).toBe(false);
    });

    it('should return false if a contract supports ERC-721', async () => {
      const contract = getContractInstance('0xeE467844905022D2A6CC1dA7A0B555608faae751', provider); //ERC-721
      const result = await doesContractSupportERC1155(contract);

      expect(result).toBe(false);
    });
  });
});

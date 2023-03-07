import { ethers } from 'ethers';
import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { ALCHEMY_HTTP_URL, IAlchemyConfig, getAlchemyTransferEvents } from '@shared/alchemy';
import { getEthNodeTransferEvents } from '@shared/ethnode';
import {
  doesContractSupportERC1155,
  doesContractSupportERC721,
  getContractInstance,
} from '@shared/nfts';
import { DBClass, IDatabaseConfig } from '@shared/db';


jest.setTimeout(3000000);


const benchmarkMap: [name: string, blockNumberFrom: number, blockNumberTo: number][] = [
  [ '1 block (14339500)', 14339500, 14339500 ],
  [ '5 blocks (14339500-14339505)', 14339500, 14339505 ],
  // [ '10 blocks (14339500-14339510)', 14339500, 14339510 ],
  // [ '20 blocks (14339500-14339520)', 14339500, 14339520 ],
  // [ '40 blocks (14339500-114339540)', 14339500, 14339540 ],
  // [ '100 blocks (14339500-114339600)', 14339500, 114339600 ],
];


describe('Benchmark', () => {

  let db: DBClass;
  let nodeAddress: string;
  let provider: ethers.providers.JsonRpcProvider;
  beforeAll(async () => {
    const appConfig: IBaseConfig = getBaseConfig();
    const alchemyConfig: IAlchemyConfig = appConfig.alchemy;
    const dbConfig: IDatabaseConfig = appConfig.database;
    db = new DBClass(dbConfig);
    await db.open();

    await db.tokens().deleteMany({});
    nodeAddress = `${ALCHEMY_HTTP_URL}/${alchemyConfig.alchemyApiKey}`;
    provider = new ethers.providers.JsonRpcProvider(nodeAddress);
  });

  describe('Events', () => {
    describe('Alchemy', () => {
      // eslint-disable-next-line jest/expect-expect
      it.each(benchmarkMap)('Alchemy events benchmark %s', async (name, blockNumberFrom, blockNumberTo) => {
        const labelName = `Alchemy events - ${name}`;
        console.time(labelName);
        await getAlchemyTransferEvents(blockNumberFrom, blockNumberTo, provider);
        console.timeEnd(labelName);
      });
    });

    describe('Ethnode', () => {
      // eslint-disable-next-line jest/expect-expect
      it.each(benchmarkMap)('Ethenode events benchmark %s', async (name, blockNumberFrom, blockNumberTo) => {
        const labelName = `Ethenode events - ${name}`;
        console.time(labelName);
        await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, false, provider);
        console.timeEnd(labelName);
      });
    });
  });

  describe('Interfaces check', () => {
    describe('ERC-721', () => {
      it('ERC-721 check benchmark for a single contract', async () => {
        const labelName = 'ERC-721 check';

        console.time(labelName);
        const contract = getContractInstance('0x7d24bb9bB72a14Aee2d22092240182BDbBD0C5D6', provider); //ERC-721
        const result = await doesContractSupportERC721(contract);
        console.timeEnd(labelName);

        expect(result).toBe(true);
      });
    });

    describe('ERC-1155', () => {
      it('ERC-1155 check benchmark for a single contract', async () => {
        const labelName = 'ERC-1155 check';

        console.time(labelName);
        const contract = getContractInstance('0x76be3b62873462d2142405439777e971754e8e77', provider); //ERC-1155
        const result = await doesContractSupportERC1155(contract);
        console.timeEnd(labelName);

        expect(result).toBe(true);
      });
    });

    describe('Contract name call', () => {
      // eslint-disable-next-line jest/expect-expect
      it('Call ERC-721 contract name benchmark', async () => {
        const labelName = 'Call ERC-721 contract name';
        const contract = getContractInstance('0x7d24bb9bB72a14Aee2d22092240182BDbBD0C5D6', provider); //ERC-721

        console.time(labelName);
        await contract.name();
        console.timeEnd(labelName);
      });

      // eslint-disable-next-line jest/expect-expect
      it('Call ERC-1155 contract name benchmark', async () => {
        const labelName = 'Call ERC-1155 contract name';
        const contract = getContractInstance('0x76be3b62873462d2142405439777e971754e8e77', provider); //ERC-1155

        console.time(labelName);
        await contract.name();
        console.timeEnd(labelName);
      });
    });

    describe('Contract tokenURI/uri call', () => {
      // eslint-disable-next-line jest/expect-expect
      it('Call ERC-721 contract tokenURI benchmark', async () => {
        const labelName = 'Call ERC-721 contract tokenURI';
        const tokenId = '0x0000000000000000000000000000000000000000000000000000000000001ecb';
        const contract = getContractInstance('0x9fb2eeb75754815c5cc9092cd53549cea5dc404f', provider); //ERC-721

        console.time(labelName);
        await contract.tokenURI(tokenId);
        console.timeEnd(labelName);
      });

      // eslint-disable-next-line jest/expect-expect
      it('Call ERC-1155 contract uri benchmark', async () => {
        const labelName = 'Call ERC-1155 contract uri';
        const tokenId = '0x04';
        const contract = getContractInstance('0xccf200d7694a7f0a325c8afd905c997a6cc3ee10', provider); //ERC-1155

        console.time(labelName);
        await contract.uri(tokenId);
        console.timeEnd(labelName);
      });
    });
  });

  afterEach(async () => {
    await db.tokens().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

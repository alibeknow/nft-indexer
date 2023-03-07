import { ethers } from 'ethers';
import {
  ETH_NODE_GET_LOGS_RETRIES,
  getEthNodeTransferEvents,
  getLogs,
} from '@shared/ethnode';
import {
  ERC_1155_TRANSFER_BATCH_SIG,
  ERC_1155_TRANSFER_SINGLE_SIG,
  ERC_721_TRANSFER_SIG,
} from '@shared/contracts';
import { TokenStandard } from '@shared/tokens';

const contractAbi = [
  ERC_721_TRANSFER_SIG,
  ERC_1155_TRANSFER_SINGLE_SIG,
  ERC_1155_TRANSFER_BATCH_SIG,
];

jest.setTimeout(40000);

describe('getEthNodeTransferEvents tests', () => {
  describe('[getLogs] function', () => {
    it('should apply retries in case of errors', async () => {
      const blockNumberFrom = 0;
      const blockNumberTo = 1;
      const nodeAddress = 'node-address';
      const fakeLogs = [ {
        blockNumber: 14316495,
        blockHash: '0x406c74d529164f5e7724aa9910169fcabdc91dc3862fe03f0177439442ce484c',
        transactionIndex: 256,
        removed: false,
        address: '0x080CE3620a3cfed6119D6c8DB0F9A56e52451729',
        data: '0x',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x000000000000000000000000c13d553558b8c31c81d2bbabf99458314483e5cb',
          '0x0000000000000000000000000000000000000000000000000000000000000a5b',
        ],
        transactionHash: '0x7c3101378aadee52169cebf4cf6508466b7433190478b9dc3c4002a85276ba2e',
        logIndex: 259,
      } ];

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);
      const iface = new ethers.utils.Interface(contractAbi);

      let counter = 0;
      jest.spyOn(provider, 'getLogs').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            if(counter < 3) {
              return reject(new Error('Some unexpected error...'));
            } else {
              return resolve(fakeLogs);
            }
          });
          counter++;
        });
      });

      const results = await getLogs(provider, blockNumberFrom, blockNumberTo);

      expect(provider.getLogs).toHaveBeenNthCalledWith(3, {
        fromBlock: blockNumberFrom,
        toBlock: blockNumberTo,
        topics: [
          [
            iface.getEventTopic('Transfer'),
            iface.getEventTopic('TransferSingle'),
            iface.getEventTopic('TransferBatch'),
          ],
        ],
      });
      expect(results).toStrictEqual(fakeLogs);

      jest.spyOn(provider, 'getLogs').mockReset();
    });

    it('should throw an error if number of retries is exceeded', async () => {
      const blockNumberFrom = 0;
      const blockNumberTo = 1;
      const nodeAddress = 'node-address';
      const fakeErrorMsg = 'Some unexpected error...';

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);
      const iface = new ethers.utils.Interface(contractAbi);

      jest.spyOn(provider, 'getLogs').mockImplementation(async () => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            reject(new Error(fakeErrorMsg));
          });
        });
      });

      await expect(async () => {
        await getLogs(provider, blockNumberFrom, blockNumberTo);
      }).rejects.toThrow(fakeErrorMsg);

      expect(provider.getLogs).toHaveBeenNthCalledWith(ETH_NODE_GET_LOGS_RETRIES, {
        fromBlock: blockNumberFrom,
        toBlock: blockNumberTo,
        topics: [
          [
            iface.getEventTopic('Transfer'),
            iface.getEventTopic('TransferSingle'),
            iface.getEventTopic('TransferBatch'),
          ],
        ],
      });

      jest.spyOn(provider, 'getLogs').mockReset();
    });
  });

  describe('[getEthNodeTransferEvents] function', () => {
    const blockNumberFrom = 0;
    const blockNumberTo = 1;
    const nodeAddress = 'node-address';
    const iface = new ethers.utils.Interface(contractAbi);

    it('should process Transfer (ERC-721) event', async () => {
      const logMock = {
        blockNumber: 14316495,
        blockHash: '0x406c74d529164f5e7724aa9910169fcabdc91dc3862fe03f0177439442ce484c',
        transactionIndex: 256,
        removed: false,
        address: '0x080CE3620a3cfed6119D6c8DB0F9A56e52451729',
        data: '0x',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x000000000000000000000000c13d553558b8c31c81d2bbabf99458314483e5cb',
          '0x0000000000000000000000000000000000000000000000000000000000000a5b',
        ],
        transactionHash: '0x7c3101378aadee52169cebf4cf6508466b7433190478b9dc3c4002a85276ba2e',
        logIndex: 259,
      };
      jest.spyOn(ethers.providers.JsonRpcProvider.prototype, 'getLogs').mockResolvedValueOnce([ logMock ]);
      const parsedLogMock = iface.parseLog(logMock);

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);
      const transferEvents = await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, false, provider);

      expect(transferEvents).toEqual([ {
        blockNumber: logMock.blockNumber,
        logIndex: logMock.logIndex,
        transactionHash: logMock.transactionHash,
        contractAddress: logMock.address,
        type: TokenStandard.ERC721,
        from: parsedLogMock.args.from,
        to: parsedLogMock.args.to,
        ids: [ '0x0a5b' ],
        values: [ 1 ],
      } ]);
    });

    it('should process TransferSingle (ERC-1155) event', async () => {
      const logMock = {
        blockNumber: 14316493,
        blockHash: '0x4ffd50be7115fae29630cdcf960c744b3493708ea7d82fb8a99b871c7af7169e',
        transactionIndex: 50,
        removed: false,
        address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
        data: '0x76f9f387db464bbf45f06fbe7bd3fd0b6ef85e1b0000000000006300000000010000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
          '0x0000000000000000000000009663190a1c57fe3c915c182b1edbd2682abb0e07',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x00000000000000000000000020cd5cfa460cf5f8cd373803d707dd47bf797200',
        ],
        transactionHash: '0x981d04891a1781f9231ed97b87b4d2c2234da24669838b38cf3c49b397828837',
        logIndex: 105,
      };
      jest.spyOn(ethers.providers.JsonRpcProvider.prototype, 'getLogs').mockResolvedValueOnce([ logMock ]);
      const parsedLogMock = iface.parseLog(logMock);

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);
      const transferEvents = await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, false, provider);

      expect(transferEvents).toEqual([ {
        blockNumber: logMock.blockNumber,
        logIndex: logMock.logIndex,
        transactionHash: logMock.transactionHash,
        contractAddress: logMock.address,
        type: TokenStandard.ERC1155,
        from: parsedLogMock.args.from,
        to: parsedLogMock.args.to,
        ids: [ '0x76f9f387db464bbf45f06fbe7bd3fd0b6ef85e1b000000000000630000000001' ],
        values: [ 1 ],
      } ]);
    });

    it('should process TransferBatch (ERC-1155) event', async () => {
      const logMock = {
        blockNumber: 14316481,
        blockHash: '0xb56e1a48752148307799f0a59b455923faed5eb02b57c871446ffc2127f9fe4c',
        transactionIndex: 25,
        removed: false,
        address: '0x76BE3b62873462d2142405439777e971754E8E77',
        // eslint-disable-next-line max-len
        data: '0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000002937000000000000000000000000000000000000000000000000000000000000298300000000000000000000000000000000000000000000000000000000000029250000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
          '0x00000000000000000000000074795f0bc4500aaa504867f603b41b623f40f299',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x00000000000000000000000018a8fc9d2226c52f5a9eef8645efbf01dfbdbe63',
        ],
        transactionHash: '0x404cca15c751991b559cbb7b5210a2f53581ac0411a626c3599fc354275af179',
        logIndex: 29,
      };
      jest.spyOn(ethers.providers.JsonRpcProvider.prototype, 'getLogs').mockResolvedValueOnce([ logMock ]);
      const parsedLogMock = iface.parseLog(logMock);

      const provider = new ethers.providers.JsonRpcProvider(nodeAddress);
      const transferEvents = await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, false, provider);

      expect(transferEvents).toEqual([ {
        blockNumber: logMock.blockNumber,
        logIndex: logMock.logIndex,
        transactionHash: logMock.transactionHash,
        contractAddress: logMock.address,
        type: TokenStandard.ERC1155,
        from: parsedLogMock.args.from,
        to: parsedLogMock.args.to,
        ids: [ '0x2937', '0x2983', '0x2925' ],
        values: [ 1, 1, 1 ],
      } ]);
    });
  });
});

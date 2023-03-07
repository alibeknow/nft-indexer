import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { ContractsRepo } from '@shared/contracts';
import { Blockchain } from '@shared/blockchain';
import { TokenStandard } from '@shared/tokens';
import { contractsFixtures } from '../fixtures/contracts.fixtures';

describe('Contracts repo', () => {
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `db-contracts-repo-test-${dbConfig.db}` });
    await db.open();
  });

  const contractAddress = '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa';

  describe('[insertIfNone]', () => {
    it('should insert new contract into db', async () => {
      const contracts = new ContractsRepo(db);

      const result = await contracts.insertIfNone({
        blockchain: Blockchain.ETH,
        address: contractAddress,
        type: TokenStandard.ERC721,
        name: 'example',
        block: 14444,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      expect(result).toMatchSnapshot();
    });

    it('should not modify existing contract', async () => {
      const contracts = new ContractsRepo(db);

      const result1 = await contracts.insertIfNone({
        blockchain: Blockchain.ETH,
        address: contractAddress,
        type: TokenStandard.ERC721,
        name: 'example',
        block: 14445,
        createdAt: new Date('2022-02-01T00:00:00'),
      });
      const result2 = await contracts.insertIfNone({
        blockchain: Blockchain.ETH,
        address: contractAddress,
        type: TokenStandard.ERC1155,
        name: 'updated',
        block: 14446,
        createdAt: new Date('2022-02-02T00:00:00'),
      });

      const cursor = db.contracts().find({});
      const contractsList = await cursor.toArray();
      expect(result1).toMatchSnapshot();
      expect(result2).toMatchSnapshot();
      expect(contractsList).toMatchSnapshot();
    });
  });

  describe('[get]', () => {
    it('should retrieve contract by id from DB', async () => {
      const id = `${Blockchain.ETH}:${contractAddress}`;
      const contracts = new ContractsRepo(db);

      await db.contracts().insertOne({
        _id: id,
        address: contractAddress,
        type: TokenStandard.ERC721,
        name: 'example',
        block: 14444,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      const contract = await contracts.get(id);
      expect(contract).toMatchSnapshot();
    });

    it('should retrieve contract by id from DB in mix lower upperCase', async () => {
      const id = `${Blockchain.ETH}:${contractAddress}`;
      const contracts = new ContractsRepo(db);

      await db.contracts().insertOne({
        _id: id,
        address: contractAddress,
        type: TokenStandard.ERC721,
        name: 'example',
        block: 14444,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      const contract = await contracts.get(id.toUpperCase());
      const contract1 = await contracts.get(id.toLowerCase());
      expect(contract).toMatchSnapshot();
      expect(contract1).toMatchSnapshot();
    });
  });

  describe('[updateName]', () => {
    it('should update name for contract stored in db', async () => {
      const id = `${Blockchain.ETH}:${contractAddress}`;
      const contracts = new ContractsRepo(db);

      await db.contracts().insertOne({
        _id: id,
        address: contractAddress,
        type: TokenStandard.ERC721,
        name: 'example',
        block: 14444,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      const result = await contracts.updateName(id, 'new name');
      const updatedContact = await db.contracts().find({ _id: id }).project({ updatedAt: 0 }).toArray();
      expect(result).toMatchSnapshot();
      expect(updatedContact[0]).toMatchSnapshot();
    });
  });

  describe('[getCreatedAfter] method', () => {
    it('should retrieve contracts documents created after a specific date', async () => {
      const contractsRepo = new ContractsRepo(db);
      await Promise.all(contractsFixtures.map(
        (contract) => contractsRepo.insertIfNone(contract),
      ));

      const result = await Promise.all([
        contractsRepo.getCreatedAfter(new Date('2019-12-17T00:00:00'), 10),
        contractsRepo.getCreatedAfter(new Date('2019-12-17T04:00:00'), 10),
        contractsRepo.getCreatedAfter(new Date('2018-12-17T04:00:00'), 10),
        contractsRepo.getCreatedAfter(new Date('2019-12-16T02:22:00'), 10),
        contractsRepo.getCreatedAfter(new Date('2019-12-17T03:26:00'), 10),
      ]);

      expect(result[0]).toHaveLength(3);
      expect(result[0]).toMatchSnapshot();
      expect(result[1]).toHaveLength(0);
      expect(result[1]).toMatchSnapshot();
      expect(result[2]).toHaveLength(5);
      expect(result[2]).toMatchSnapshot();
      expect(result[3]).toHaveLength(3);
      expect(result[3]).toMatchSnapshot();
      expect(result[4]).toHaveLength(0);
      expect(result[4]).toMatchSnapshot();
    });
  });

  afterEach(async () => {
    await db.contracts().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { Token, TokenMetadataStatus, TokensRepo } from '@shared/tokens';
import { Blockchain } from '@shared/blockchain';

jest.setTimeout(50000);

describe('Token repo', () => {
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `db-tokens-repo-test-${dbConfig.db}` });
    await db.open();
  });

  describe('[save] method', () => {
    it('should save a token document to MongoDB in tokens collection', async () => {
      const contractAddress = '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenId = '0xc4425a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenRepo = new TokensRepo(db);
      const saveTokenResult = await tokenRepo.save({
        block: 213123,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        blockchain: Blockchain.ETH,
        contractAddress,
        tokenId,
        tokenUri: 'some uri',
        count: 1,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      const doc = await db.tokens().findOne({ _id: `${Blockchain.ETH}:${contractAddress}:${tokenId}` });

      expect(doc).toMatchSnapshot();
      expect(saveTokenResult).toMatchSnapshot();
    });
  });

  describe('[upsert] method', () => {
    it('should not update existing document', async () => {
      const contractAddress = '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenId = '0xc4425a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenRepo = new TokensRepo(db);
      const tokenAttrs = {
        block: 213123,
        blockchain: Blockchain.ETH,
        contractAddress,
        tokenId,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        tokenUri: 'some uri',
        count: 1,
        createdAt: new Date('2022-02-01T00:00:00'),
      };
      await tokenRepo.save(tokenAttrs);

      const upsertTokenResult = await tokenRepo.upsert({
        ...tokenAttrs,
        tokenUri: 'new uri',
      });

      const doc = await db.tokens().findOne({ _id: `${Blockchain.ETH}:${contractAddress}:${tokenId}` });

      expect(doc).toMatchSnapshot();
      expect(upsertTokenResult).toMatchSnapshot();
    });

    it('should create new document if the same is not exists', async () => {
      const contractAddress = '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenId = '0xc4425a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenRepo = new TokensRepo(db);

      const upsertTokenResult = await tokenRepo.upsert({
        block: 213123,
        blockchain: Blockchain.ETH,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        contractAddress,
        tokenId,
        tokenUri: 'some uri',
        count: 1,
        createdAt: new Date('2022-02-01T00:00:00'),
      });

      const doc = await db.tokens().findOne({ _id: `${Blockchain.ETH}:${contractAddress}:${tokenId}` });

      expect(doc).toMatchSnapshot();
      expect(upsertTokenResult).toMatchSnapshot();
    });
  });

  describe('[getById] method', () => {
    it('should retrieve a token document from MongoDB tokens collection', async () => {
      const tokenRepo = new TokensRepo(db);
      const contractAddress = '0xf70074f1cb0aa67917bbecf5476a6778e2056671';
      const tokenId = '0x00';

      await tokenRepo.save({
        block: 213123,
        blockchain: Blockchain.ETH,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        contractAddress,
        tokenId,
        tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/0',
        count: 1,
        createdAt: new Date('2021-12-31T02:15:00'),
      });

      const result = await tokenRepo.getById(`${Blockchain.ETH}:${contractAddress}:${tokenId}`);

      expect(result).toMatchSnapshot();
    });
  });

  describe('[updateCount] method', () => {
    it('should update count for a single document in MongoDB tokens collection', async () => {
      const tokenRepo = new TokensRepo(db);
      const contractAddress = '0xf70074f1cb0aa67917bbecf5476a6778e2056671';
      const tokenId = '0x00';

      await tokenRepo.save({
        block: 213123,
        blockchain: Blockchain.ETH,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        contractAddress,
        tokenId,
        tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/0',
        count: 1,
        createdAt: new Date('2019-12-17T03:24:00'),
      });

      const id = `${Blockchain.ETH}:${contractAddress}:${tokenId}`;
      await tokenRepo.updateCount(id, 5);
      const docFromDB = await db.tokens().findOne<Token>({ _id: id });

      expect(docFromDB).toMatchSnapshot();
    });
  });

  describe('[updateUri] method', () => {
    it('should update tokenUri for a single document in MongoDB tokens collection', async () => {
      const tokenRepo = new TokensRepo(db);
      const contractAddress = '0xf70074f1cb0aa67917bbecf5476a6778e2056671';
      const tokenId = '0x00';

      await tokenRepo.save({
        block: 213123,
        blockchain: Blockchain.ETH,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        contractAddress,
        tokenId,
        tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/0',
        count: 1,
        createdAt: new Date('2019-12-17T03:24:00'),
      });

      const id = `${Blockchain.ETH}:${contractAddress}:${tokenId}`;
      await tokenRepo.updateUri(id, 'ipfs://QmdRczyazySklhsdYsdh/1');
      const [ docFromDB ] = await db.tokens().find<Token>({ _id: id }).project({ updatedAt: 0 }).toArray();

      expect(docFromDB).toMatchSnapshot();
    });

    it('should update tokenUri for a single document in MongoDB tokens collection when tokenUri is null', async () => {
      const tokenRepo = new TokensRepo(db);
      const contractAddress = '0xf70074f1cb0aa67917bbecf5476a6778e2056671';
      const tokenId = '0x00';

      await db.tokens().insertOne({
        _id: 'eth:0x8Ce66fF0865570D1ff0BB0098Fa41B4dc61E02e6:0x0747',
        block: 213123,
        from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        tokenUri: null,
        count: 1,
        tokenMetadataStatus: TokenMetadataStatus.UNDEFINED,
        retryCount: 0,
        createdAt: new Date('2019-12-17T03:24:00'),
      });
      const id = `${Blockchain.ETH}:${contractAddress}:${tokenId}`;
      await tokenRepo.updateUri(id, 'ipfs://QmdRczyazySklhsdYsdh/1');
      const [ docFromDB ] = await db.tokens().find<Token>({ _id: id }).project({ updatedAt: 0 }).toArray();
      expect(docFromDB).toMatchSnapshot();
    });
  });

  describe('[getCreatedAfter] method', () => {
    it('should retrieve token documents created after a specific date', async () => {
      const tokenRepo = new TokensRepo(db);
      const block = 213123;
      const blockchain = Blockchain.ETH;
      const count = 1;

      const tokens = [
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x00', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/1', createdAt: new Date('2019-12-15T04:55:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x01', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/2', createdAt: new Date('2019-12-16T02:22:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x02', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/3', createdAt: new Date('2019-12-17T03:24:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056672',
          tokenId: '0x03', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/4', createdAt: new Date('2019-12-17T03:25:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056673',
          tokenId: '0x04', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/5', createdAt: new Date('2019-12-17T03:26:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
      ];

      await Promise.all(tokens.map(
        (token) => tokenRepo.save(token),
      ));

      const result = await Promise.all([
        tokenRepo.getCreatedAfter(new Date('2019-12-17T00:00:00'), 10),
        tokenRepo.getCreatedAfter(new Date('2019-12-17T04:00:00'), 10),
        tokenRepo.getCreatedAfter(new Date('2018-12-17T04:00:00'), 10),
        tokenRepo.getCreatedAfter(new Date('2019-12-16T02:22:00'), 10),
        tokenRepo.getCreatedAfter(new Date('2019-12-17T03:26:00'), 10),
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

  describe('[getCreatedAfter2] method', () => {
    it('should retrieve token documents created after a specific date', async () => {
      const tokenRepo = new TokensRepo(db);
      const block = 213123;
      const blockchain = Blockchain.ETH;
      const count = 1;

      const tokens = [
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x01', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/2', createdAt: new Date('2019-12-15T04:55:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x00', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/1', createdAt: new Date('2019-12-15T04:55:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x02', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/3', createdAt: new Date('2019-12-17T03:24:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056672',
          tokenId: '0x03', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/4', createdAt: new Date('2019-12-17T03:24:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056673',
          tokenId: '0x04', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/5', createdAt: new Date('2019-12-17T03:26:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
      ];

      await Promise.all(tokens.map(
        (token) => tokenRepo.save(token),
      ));

      const result = await Promise.all([
        tokenRepo.getCreatedAfter2(new Date('2019-12-17T00:00:00'), 'eth:0xf70074f1cb0aa67917bbecf5476a6778e2056672:0x02', 10),
        tokenRepo.getCreatedAfter2(new Date('2019-12-17T04:00:00'), '', 10),
        tokenRepo.getCreatedAfter2(new Date('2018-12-17T04:00:00'), 'eth:0xf70074f1cb0aa67917bbecf5476a6778e2056671:0x00', 10),
        tokenRepo.getCreatedAfter2(new Date('2019-12-16T02:22:00'), 'eth:0xf70074f1cb0aa67917bbecf5476a6778e2056672:0x03', 10),
        tokenRepo.getCreatedAfter2(new Date('2019-12-17T03:26:00'), '', 10),
      ]);

      expect(result[0]).toMatchSnapshot();
      expect(result[1]).toMatchSnapshot();
      expect(result[2]).toMatchSnapshot();
      expect(result[3]).toMatchSnapshot();
      expect(result[4]).toMatchSnapshot();
    });
  });

  describe('[listForBlockRange] method', () => {
    it('should return block range', async () => {
      const tokenRepo = new TokensRepo(db);
      const blockchain = Blockchain.ETH;
      const count = 1;

      const tokens = [
        {
          block: 213123, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x01', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/2', createdAt: new Date('2019-12-15T04:55:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block: 213123, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x00', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/1', createdAt: new Date('2019-12-15T04:55:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block: 213123, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056671',
          tokenId: '0x02', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/3', createdAt: new Date('2019-12-17T03:24:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block: 213124, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056672',
          tokenId: '0x03', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/4', createdAt: new Date('2019-12-17T03:24:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
        {
          block: 213125, blockchain, count, contractAddress: '0xf70074f1cb0aa67917bbecf5476a6778e2056673',
          tokenId: '0x04', tokenUri: 'ipfs://QmdRczyazySklhsdYsdh/5', createdAt: new Date('2019-12-17T03:26:00'),
          from: '0x92a38d2d5361D883109FD44e66dA81C2E23523aD',
        },
      ];

      await Promise.all(tokens.map(
        (token) => tokenRepo.save(token),
      ));

      const result1 = await tokenRepo.listForBlockRange(213125, 'eth:0xf70074f1cb0aa67917bbecf5476a6778e2056672:0x00', 213123, 10);
      const result2 = await tokenRepo.listForBlockRange(213130, '', 213126, 10);
      const result3 = await tokenRepo.listForBlockRange(213125, '', 213123, 10);
      const result4 = await tokenRepo.listForBlockRange(213125, 'eth:0xf70074f1cb0aa67917bbecf5476a6778e2056672:0x00', 213124, 10);

      expect(result1).toMatchSnapshot();
      expect(result2).toMatchSnapshot();
      expect(result3).toMatchSnapshot();
      expect(result4).toMatchSnapshot();
    });
  });

  afterEach(async () => {
    await db.tokens().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { EventsRepo } from '@shared/events';
import { TokenStandard } from '@shared/tokens';

describe('Events repo', () => {
  let db: DBClass;
  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `db-events-repo-test-${dbConfig.db}` });
    await db.open();
  });

  describe('[bulkSave] method', () => {
    it('should save batch of events in events collection', async () => {
      const eventsRepo = new EventsRepo(db);
      const saveEventsResult = await eventsRepo.bulkSave([ {
        blockNumber: 14306496,
        logIndex: 193,
        transactionHash: '0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2',
        contractAddress: '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'fake-id-1', 'fake-id-2' ],
        values: [ 2, 4 ],
      }, {
        blockNumber: 14306497,
        logIndex: 1,
        transactionHash: '0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55',
        contractAddress: '0xfd79412d240cfc6aac4545a0f49e1246bdba8601',
        type: TokenStandard.ERC1155,
        from: '',
        to: '',
        ids: [ 'fake-id' ],
        values: [ 2 ],
      }, {
        blockNumber: 14306498,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      } ]);

      const docs = await db.events().find({ _id: { $in: [
        '14306496:0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2:193',
        '14306497:0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55:1',
        '14306498:0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2:25',
      ] } }).toArray();

      // To get rid of non-permanent field createdAt
      // eslint-disable-next-line
      const docsWithoutCreatedAt = docs.map(({ createdAt,  ...rest }) => ({ ...rest }));

      expect(docsWithoutCreatedAt).toMatchSnapshot();
      expect(saveEventsResult).toMatchSnapshot();
    });
  });

  describe('[getByBlockRange] method', () => {
    it('should return event documents by block range ordered by createdAt', async () => {
      const eventsRepo = new EventsRepo(db);
      await eventsRepo.bulkSave([ {
        blockNumber: 14306496,
        logIndex: 193,
        transactionHash: '0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2',
        contractAddress: '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'fake-id-1', 'fake-id-2' ],
        values: [ 2, 4 ],
      }, {
        blockNumber: 14306496,
        logIndex: 1,
        transactionHash: '0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55',
        contractAddress: '0xfd79412d240cfc6aac4545a0f49e1246bdba8601',
        type: TokenStandard.ERC1155,
        from: '',
        to: '',
        ids: [ 'fake-id' ],
        values: [ 2 ],
      }, {
        blockNumber: 14306498,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      } ]);

      const firstBlockDocs = await eventsRepo.getByBlockRange(14306496, 14306497);
      const secondBlockDocs = await eventsRepo.getByBlockRange(14306498, 14306499);

      // To get rid of non-permanent field createdAt
      // eslint-disable-next-line
      const firstBlockDocsWithoutCreatedAt = firstBlockDocs.map(({ createdAt,  ...rest }) => ({ ...rest }));
      // eslint-disable-next-line
      const secondBlockDocsWithoutCreatedAt = secondBlockDocs.map(({ createdAt,  ...rest }) => ({ ...rest }));

      expect(firstBlockDocs).toHaveLength(2);
      expect(firstBlockDocsWithoutCreatedAt).toMatchSnapshot();
      expect(secondBlockDocs).toHaveLength(1);
      expect(secondBlockDocsWithoutCreatedAt).toMatchSnapshot();
    });
  });

  describe('[deleteWhereBlockNumberGreaterThan] method', () => {
    it('should delete events where block greater than a provided block', async () => {
      const eventsRepo = new EventsRepo(db);
      await eventsRepo.bulkSave([ {
        blockNumber: 14306496,
        logIndex: 193,
        transactionHash: '0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2',
        contractAddress: '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'fake-id-1', 'fake-id-2' ],
        values: [ 2, 4 ],
      }, {
        blockNumber: 14306496,
        logIndex: 1,
        transactionHash: '0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55',
        contractAddress: '0xfd79412d240cfc6aac4545a0f49e1246bdba8601',
        type: TokenStandard.ERC1155,
        from: '',
        to: '',
        ids: [ 'fake-id' ],
        values: [ 2 ],
      }, {
        blockNumber: 14306498,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      }, {
        blockNumber: 14306499,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      } ]);

      const docsBeforeDeletion = await db.events().find().toArray();
      await eventsRepo.deleteWhereBlockNumberGreaterThan(14306498);
      const docs = await db.events().find().toArray();

      expect(docsBeforeDeletion).toHaveLength(4);
      expect(docs).toHaveLength(3);
    });
  });

  describe('[deleteByBlockRange] method', () => {
    it('should delete events within block range', async () => {
      const eventsRepo = new EventsRepo(db);
      await eventsRepo.bulkSave([ {
        blockNumber: 14306496,
        logIndex: 193,
        transactionHash: '0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2',
        contractAddress: '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'fake-id-1', 'fake-id-2' ],
        values: [ 2, 4 ],
      }, {
        blockNumber: 14306496,
        logIndex: 1,
        transactionHash: '0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55',
        contractAddress: '0xfd79412d240cfc6aac4545a0f49e1246bdba8601',
        type: TokenStandard.ERC1155,
        from: '',
        to: '',
        ids: [ 'fake-id' ],
        values: [ 2 ],
      }, {
        blockNumber: 14306498,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      }, {
        blockNumber: 14306499,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      } ]);

      const docsBeforeDeletion = await db.events().find().toArray();
      await eventsRepo.deleteByBlockRange(14306496, 14306498);
      const docs = await db.events().find().toArray();

      expect(docsBeforeDeletion).toHaveLength(4);
      expect(docs).toHaveLength(1);
    });
  });

  describe('[countByBlockRange] method', () => {
    it('should return number of events within block range', async () => {
      const eventsRepo = new EventsRepo(db);
      await eventsRepo.bulkSave([ {
        blockNumber: 14306496,
        logIndex: 193,
        transactionHash: '0xfd1ac0250ccc5719cf31e55865141c1c1a746a4933f04a2545fd70a0be984bb2',
        contractAddress: '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'fake-id-1', 'fake-id-2' ],
        values: [ 2, 4 ],
      }, {
        blockNumber: 14306496,
        logIndex: 1,
        transactionHash: '0x865141c1c1a746a4933f04a2545fd70a0be984bb2fd1ac0250ccc5719cf31e55',
        contractAddress: '0xfd79412d240cfc6aac4545a0f49e1246bdba8601',
        type: TokenStandard.ERC1155,
        from: '',
        to: '',
        ids: [ 'fake-id' ],
        values: [ 2 ],
      }, {
        blockNumber: 14306498,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      }, {
        blockNumber: 14306499,
        logIndex: 25,
        transactionHash: '0x31e55865141c1c1a746a4fd1ac0250ccc5719cf933f04a2545fd70a0be984bb2',
        contractAddress: '0x601fd79412dc4545aa8240cfc6aa0f49e1246bdb',
        type: TokenStandard.ERC721,
        from: '',
        to: '',
        ids: [ 'some-id' ],
        values: [ 1 ],
      } ]);

      const result1 = await eventsRepo.countByBlockRange(14306496, 14306498);
      const result2 = await eventsRepo.countByBlockRange(1, 15306498);
      const result3 = await eventsRepo.countByBlockRange(14306498, 14306498);
      const result4 = await eventsRepo.countByBlockRange(14306496, 14306496);

      expect(result1).toBe(3);
      expect(result2).toBe(4);
      expect(result3).toBe(1);
      expect(result4).toBe(2);
    });
  });

  afterEach(async () => {
    await db.events().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

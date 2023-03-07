import { WithId } from 'mongodb';
import { BlockQueue, BlocksQueueRepo } from '@shared/blocks-queue';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';

jest.setTimeout(100000);

describe('Blocks queue repo', () => {
  let db: DBClass;
  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `db-blocks-queue-repo-test-${dbConfig.db}` });
    await db.open();
  });

  describe('[save] method', () => {
    it('should save a document to MongoDB in range queue collection', async () => {
      const from = 14316460;
      const to = 14316495;
      const toHash = '0x55836c255338b545522ceac0966e4a04da387bd84e2a4c830c28feb07693de2a';
      const rangeQueueRepo = new BlocksQueueRepo(db);
      const saveResult = await rangeQueueRepo.save({
        from,
        to,
        toHash,
        createdAt: new Date('2019-12-15T04:55:00'),
      });

      const docs = await db.blocksQueue().find({ _id: saveResult.insertedId }).toArray();
      // To get rid of non-permanent field _id
      // eslint-disable-next-line
      expect(docs.map(({ _id, ...rest }) => ({ ...rest }))).toMatchSnapshot();
    });
  });

  describe('[getCreatedAfter] method', () => {
    it('should retrieve range queue documents created after a specific date', async () => {
      const rangeQueueRepo = new BlocksQueueRepo(db);

      const ranges = [
        {
          from: 14316461,
          to: 14316465,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-15T04:55:00'),
        },
        {
          from: 14316466,
          to: 14316470,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-16T02:22:00'),
        },
        {
          from: 14316471,
          to: 14316475,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-17T03:24:00'),
        },
        {
          from: 14316476,
          to: 14316480,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-17T03:25:00'),
        },
        {
          from: 14316481,
          to: 14316485,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-17T03:26:00'),
        },
      ];

      await Promise.all(ranges.map(
        (range) => rangeQueueRepo.save(range),
      ));

      const result = await Promise.all([
        rangeQueueRepo.getCreatedAfter(new Date('2019-12-17T00:00:00'), 10),
        rangeQueueRepo.getCreatedAfter(new Date('2019-12-17T04:00:00'), 10),
        rangeQueueRepo.getCreatedAfter(new Date('2018-12-17T04:00:00'), 10),
        rangeQueueRepo.getCreatedAfter(new Date('2019-12-16T02:22:00'), 10),
        rangeQueueRepo.getCreatedAfter(new Date('2019-12-17T03:26:00'), 10),
      ]);

      // To get rid of non-permanent field _id
      // eslint-disable-next-line
      const prepareResults = (items: WithId<BlockQueue>[]) => items.map(({ _id, ...rest }) => ({ ...rest }));

      expect(prepareResults(result[0])).toHaveLength(3);
      expect(prepareResults(result[0])).toMatchSnapshot();
      expect(prepareResults(result[1])).toHaveLength(0);
      expect(prepareResults(result[1])).toMatchSnapshot();
      expect(prepareResults(result[2])).toHaveLength(5);
      expect(prepareResults(result[2])).toMatchSnapshot();
      expect(prepareResults(result[3])).toHaveLength(3);
      expect(prepareResults(result[3])).toMatchSnapshot();
      expect(prepareResults(result[4])).toHaveLength(0);
      expect(prepareResults(result[4])).toMatchSnapshot();
    });
  });

  describe('[getLatest] method', () => {
    it('should retrieve the latest range queue document', async () => {
      const rangeQueueRepo = new BlocksQueueRepo(db);

      const ranges = [
        {
          from: 14316461,
          to: 14316465,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-15T04:55:00'),
        },
        {
          from: 14316466,
          to: 14316470,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-18T02:22:00'),
        },
        {
          from: 14316471,
          to: 14316471,
          toHash: 'fake-hash',
          createdAt: new Date('2019-12-17T03:24:00'),
        },
      ];

      await Promise.all(ranges.map(
        (range) => rangeQueueRepo.save(range),
      ));

      const result = await rangeQueueRepo.getLatest(14316471);

      // To get rid of non-permanent field _id
      /* eslint-disable */
      // @ts-ignore
      const { _id, ...rest } = result;
      /* eslint-enable */

      expect(result?.createdAt).toEqual(new Date('2019-12-18T02:22:00'));
      expect(rest).toMatchSnapshot();
    });
  });

  describe('[softDelete] method', () => {
    it('should update block range queue with isDeleted = true', async () => {
      const rangeQueueRepo = new BlocksQueueRepo(db);
      const from = 14316461;
      const to = 14316465;

      const saveResult = await rangeQueueRepo.save({
        from,
        to,
        toHash: 'fake-hash',
        createdAt: new Date('2019-12-15T04:55:00'),
      });
      await rangeQueueRepo.softDelete(from, to);
      const doc = await db.blocksQueue().findOne({ _id: saveResult.insertedId });

      // To get rid of non-permanent field _id
      /* eslint-disable */
      // @ts-ignore
      const { _id, ...rest } = doc;
      /* eslint-enable */

      expect(rest).toMatchSnapshot();
    });
  });

  afterEach(async () => {
    await db.blocksQueue().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

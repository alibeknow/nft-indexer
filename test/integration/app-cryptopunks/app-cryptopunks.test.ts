import * as ethers from 'ethers';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { processCryptoPunks }  from '@app-cryptopunks/cryptopunks';
import { IBaseConfig } from '@shared/baseconfig';
import { fixturePunkImageSvg } from './fixtures/fixture.punkImageSvg';

jest.setTimeout(100000);

jest.spyOn(ethers, 'Contract').mockImplementation(
  jest.fn().mockImplementation(() => {
    return {
      totalSupply: jest
        .fn()
        .mockReturnValue(3),
      punkImageSvg: jest
        .fn()
        .mockReturnValue(fixturePunkImageSvg),
    };
  }),
);

describe('app-cryptopunks', () => {
  let db: DBClass;
  let dbConfig: IDatabaseConfig;

  beforeAll(async () => {
    const baseDbConfig: IDatabaseConfig = getDatabaseConfig();
    dbConfig = { ...baseDbConfig, db: `app-cryptopunks-test-${baseDbConfig.db}` };
    db = new DBClass(dbConfig);
    await db.open();

    await Promise.all([
      db.tokens().deleteMany({}),
      db.contracts().deleteMany({}),
    ]);
  });

  it('should write cryptopunks contract data and tokens to contracts collection', async () => {
    const baseConfig = {
      database: dbConfig,
      web3: {
        protocol: process.env.NODE_PROTOCOL as string,
        host: process.env.NODE_HOST as string,
        username: process.env.NODE_USERNAME,
        password: process.env.NODE_PASSWORD,
      },
    };
    await processCryptoPunks(baseConfig as IBaseConfig);
    const contractsResult = await db.contracts().find({}).project({ createdAt: 0, updatedAt: 0 }).toArray();
    const tokensResult = await db.tokens().find({}).project({ createdAt: 0, updatedAt: 0 }).toArray();

    expect(contractsResult).toMatchSnapshot();
    expect(tokensResult).toMatchSnapshot();
  });

  afterAll(async () => {
    await db.tokens().deleteMany({});
    await db.contracts().deleteMany({});
    await db.close(true);
  });
});


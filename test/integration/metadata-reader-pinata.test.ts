process.env.METADATA_REPO_PROVIDER = 'mongo';

import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { IMetadataReaderConfig, getMetadataReaderConfig } from '@app-metadata-reader/app.config';
import { MetadataReaderService } from '@app-metadata-reader/metadata-reader';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { MetadataRepoDB } from '@shared/metadata';
import { TokensRepo } from '@shared/tokens';
import { fixturePinataTokens } from './fixtures/tokens.pinata.fixtures';
import { fixtureResponse } from './fixtures/fixture.response';

jest.setTimeout(100000);

describe('[metadata-reader-pinata]', () => {
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `metadata-reader-pinata-test-${dbConfig.db}` });
    await db.open();

    await db.metadata().deleteMany({});
    await db.tokens().deleteMany({});
  });

  it('should extract metadata from tokens and convert to pinata', async () => {
    await db.tokens().insertMany(fixturePinataTokens);
    const metadataReaderConfig: IMetadataReaderConfig = getMetadataReaderConfig();
    metadataReaderConfig.service.workersCount = 10;
    metadataReaderConfig.service.usePinata = true;
    metadataReaderConfig.service.pinataRetries = 0;
    metadataReaderConfig.service.ipfsGatewayFallback = false;
    metadataReaderConfig.service.defaultGateway = 'https://gateway.pinata.cloud';

    for (const fixtureToken of fixturePinataTokens) {
      nock(fixtureToken.tokenUri).persist().get(/.*/).reply(200, fixtureResponse);
    }

    const configService = new ConfigService<IMetadataReaderConfig>(metadataReaderConfig);
    const r = new MetadataReaderService(
      new TokensRepo(db),
      new MetadataRepoDB(db),
      configService,
    );

    const tokensCount = await r.read(100, 10);
    const tokens = await db.tokens().find({}).toArray();

    // eslint-disable-next-line
    const tokensWithoutCreatedAt = tokens.map(({ createdAt,  ...rest }) => ({ ...rest }));
    const metadataTokens = await db.metadata().countDocuments();

    expect(tokensCount).toEqual(fixturePinataTokens.length);
    expect(metadataTokens).toEqual(fixturePinataTokens.length);
    expect(tokensWithoutCreatedAt).toMatchSnapshot();
  });

  afterEach(async () => {
    await db.tokens().deleteMany({});
    await db.metadata().deleteMany({});
    nock.cleanAll();
  });

  afterAll(async () => {
    await db.close(true);
  });
});

process.env.METADATA_REPO_PROVIDER = 'mongo';

import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { IMetadataReaderConfig, getMetadataReaderConfig } from '@app-metadata-reader/app.config';
import { MetadataReaderService } from '@app-metadata-reader/metadata-reader';
import { DBClass, IDatabaseConfig, MongoSort, getDatabaseConfig } from '@shared/db';
import { MetadataRepoDB } from '@shared/metadata';
import { TokensRepo } from '@shared/tokens';
import { fixtureTokens } from './fixtures/tokens.fixtures';
import { fixtureResponse } from './fixtures/fixture.response';
import { fixtureIpfsresponse } from './fixtures/fixture.ipfs.response';

jest.setTimeout(100000);

describe('[metadata-reader]', () => {
  let db: DBClass;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `metadata-reader-test-${dbConfig.db}` });
    await db.open();
    nock.disableNetConnect();
  });

  it('should extract metadata from tokens', async () => {
    await db.tokens().insertMany(fixtureTokens);

    const metadataReaderConfig: IMetadataReaderConfig = getMetadataReaderConfig();
    metadataReaderConfig.service.workersCount = 10;
    metadataReaderConfig.service.usePinata = true;
    metadataReaderConfig.service.pinataRetries = 0;
    metadataReaderConfig.service.ipfsGatewayFallback = false;
    metadataReaderConfig.service.defaultGateway = 'https://fake-gateway.pinata.cloud';

    for (const fixtureToken of fixtureTokens) {
      nock(fixtureToken.tokenUri)
        .get('')
        .reply(200, fixtureResponse);
    }

    nock('https://fake-gateway.pinata.cloud/ipfs/Qmdv7R7C14NqHPLPyQdcCY613w5trQyKHfBsegutRuANF4/7883.json')
      .get('')
      .reply(200, fixtureIpfsresponse);

    nock('https://fake-gateway.pinata.cloud/ipfs/QmfLD1MR5uez7xDh28asEuGTUBVBMYQBxvsq6CAcpGuSJb/4')
      .get('')
      .reply(200, fixtureIpfsresponse);

    nock('https://fake-gateway.pinata.cloud/ipfs/QmYGPih59j1BDXPkTysE6To7WQ4uqMAqexQVrunsXjGFj7/1088.json')
      .get('')
      .reply(200, fixtureIpfsresponse);

    nock('https://fake-gateway.pinata.cloud/ipfs/QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/382.json')
      .get('')
      .reply(200, fixtureIpfsresponse);

    const configService = new ConfigService<IMetadataReaderConfig>(metadataReaderConfig);
    const r = new MetadataReaderService(
      new TokensRepo(db),
      new MetadataRepoDB(db),
      configService,
    );

    const tokensCount = await r.read(100, 10);
    const metadataTokens = await db.metadata().find({}).sort({ _id: MongoSort.ASC }).toArray();

    expect(tokensCount).toEqual(fixtureTokens.length);
    expect(metadataTokens).toMatchSnapshot();
    expect(metadataTokens).toHaveLength(fixtureTokens.length);
  });


  afterEach(async () => {
    await db.tokens().deleteMany({});
    await db.metadata().deleteMany({});
    nock.cleanAll();
  });

  afterAll(async () => {
    nock.enableNetConnect();
    await db.close(true);
  });
});

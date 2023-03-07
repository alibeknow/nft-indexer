process.env.METADATA_REPO_PROVIDER = 'mongo';

import nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { IMetadataReaderConfig, getMetadataReaderConfig } from '@app-metadata-reader/app.config';
import { MetadataRepoDB, MetadataRepoStorage } from '@shared/metadata';
import { MetadataReaderService } from '@app-metadata-reader/metadata-reader';
import { S3Provider } from '@shared/aws';
import { IBaseConfig } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { MetadataEventData } from '@shared/microservices';
import { TokenStandard, TokensRepo } from '@shared/tokens';
import { fixtureResponse } from './fixtures/fixture.response';

jest.setTimeout(40000);

describe('[metadata-reader readOne]', () => {
  let db: DBClass;
  let s3Provider: S3Provider<IBaseConfig>;
  let bucketName: string;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `metadata-reader-read-one-test-${dbConfig.db}` });
    await db.open();

    s3Provider = new S3Provider(new ConfigService<IBaseConfig, false>());
    bucketName = `metadata-${uuidv4()}`;
    await s3Provider.storage.createBucket({ Bucket: bucketName }).promise();
  });

  beforeEach(async () => {
    await db.metadata().deleteMany({});
    await db.tokens().deleteMany({});
  });


  it('should extract metadata from tokens & return 1', async () => {
    const metadataReaderConfig: IMetadataReaderConfig = getMetadataReaderConfig();
    metadataReaderConfig.service.workersCount = 10;
    metadataReaderConfig.service.usePinata = false;
    metadataReaderConfig.service.pinataRetries = 0;
    metadataReaderConfig.service.ipfsGatewayFallback = false;
    metadataReaderConfig.service.defaultGateway = '';

    const configService = new ConfigService<IMetadataReaderConfig>(metadataReaderConfig);
    const r = new MetadataReaderService(
      new TokensRepo(db),
      new MetadataRepoDB(db),
      configService,
    );
    const tokenUri = 'http://api.braindom.xyz/ipfs/12';
    nock(tokenUri).get('').reply(200, fixtureResponse);
    const metadataInputs: MetadataEventData = { blockchainName: Blockchain.ETH,
      blockNumber: 14316462, contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f', tokenId: '0x0c', tokenUri,
      contractType: TokenStandard.ERC1155 };
    await r.readOne(metadataInputs);
    await r.wg.wait();
    const countMetadata = await db.metadata().countDocuments();
    expect(countMetadata).toBe(1);
  });

  it('should extract metadata from tokens & put it to s3', async () => {
    const metadataReaderConfig: IMetadataReaderConfig = getMetadataReaderConfig();
    metadataReaderConfig.service.workersCount = 10;
    metadataReaderConfig.service.usePinata = false;
    metadataReaderConfig.service.pinataRetries = 0;
    metadataReaderConfig.service.ipfsGatewayFallback = false;
    metadataReaderConfig.service.defaultGateway = '';

    const configService = new ConfigService<IMetadataReaderConfig>(metadataReaderConfig);
    const r = new MetadataReaderService(
      new TokensRepo(db),
      new MetadataRepoStorage(s3Provider, bucketName),
      configService,
    );
    const tokenUri = 'http://api.braindom.xyz/ipfs/12';
    nock(tokenUri).get('').reply(200, fixtureResponse);
    const tokenRef = `${Blockchain.ETH}:0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f:0x0c.json`;

    const metadataInputs: MetadataEventData = {
      blockchainName: Blockchain.ETH,
      blockNumber: 14316462,
      contractAddress: '0x9FB2EEb75754815c5Cc9092Cd53549cEa5dc404f',
      tokenId: '0x0c',
      tokenUri,
      contractType: TokenStandard.ERC1155,
    };
    await r.readOne(metadataInputs);
    await r.wg.wait();

    const countMetadata = await db.metadata().countDocuments();
    expect(countMetadata).toBe(0);
    const objectExist = await s3Provider.objectExist(bucketName, tokenRef);
    const listObjects = await s3Provider.storage.listObjectsV2({
      Bucket: bucketName,
      Delimiter: '/',
      Prefix: '',
      MaxKeys: 100,
    }).promise();
    await s3Provider.storage.deleteObject({ Bucket: bucketName, Key: tokenRef }).promise();

    expect(objectExist).toBe(true);
    expect(listObjects).toHaveProperty('Contents');
    expect(listObjects.Contents).toHaveLength(1);
  });

  afterEach(async () => {
    nock.cleanAll();
    await db.metadata().deleteMany({});
    await db.tokens().deleteMany({});
  });

  afterAll(async () => {
    await s3Provider.storage.deleteBucket({ Bucket: bucketName }).promise();
    await db.tokens().deleteMany({});
    await db.metadata().deleteMany({});
    await db.close(true);
  });
});


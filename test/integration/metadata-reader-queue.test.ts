import { v4 as uuid } from 'uuid';

process.env.RABBIT_BLOCK_READ_QUEUE = `test-queue-${uuid()}`;
process.env.METADATA_REPO_PROVIDER = 'mongo';

import nock from 'nock';
import { lastValueFrom } from 'rxjs';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IMetadataReaderConfig, IServiceConfig, getMetadataReaderConfig } from '@app-metadata-reader/app.config';
import { MetadataReaderModule, MetadataReaderService } from '@app-metadata-reader/metadata-reader';
import { Blockchain } from '@shared/blockchain';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { IPFS_GATEWAY_HOST, IPFS_GATEWAY_PORT } from '@shared/metadata';
import { MetadataEventData, ServiceEvents } from '@shared/microservices';
import { bootstrapMicroservice, clientFactory } from '@shared/microservices';
import { TokenStandard } from '@shared/tokens';

import { fixtureIpfsresponse } from './fixtures/fixture.ipfs.response';
import { fixtureResponse } from './fixtures/fixture.response';
import { fixtureTokens } from './fixtures/tokens.fixtures';

jest.setTimeout(100000);

describe('[metadata-reader queue]', () => {
  let app: INestApplication;
  let db: DBClass;
  let client: ClientProxy;
  let metadataReaderService: MetadataReaderService;

  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `metadata-reader-queue-test-${dbConfig.db}` });
    await db.open();

    const moduleRef = await Test.createTestingModule({
      imports: [
        MetadataReaderModule,
        ConfigModule.forRoot({
          load: [ getMetadataReaderConfig ],
          isGlobal: true,
        }),
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    metadataReaderService = app.get<MetadataReaderService>(MetadataReaderService);

    const configService = moduleRef.get<ConfigService<IMetadataReaderConfig>>(ConfigService<IMetadataReaderConfig>);
    const serviceConfig = configService.get<IServiceConfig>('service') as IServiceConfig;

    await bootstrapMicroservice(app, 'metadataQueue');
    await app.listen(serviceConfig.port);

    client = clientFactory(configService, 'metadataQueue');
    await client.connect();
  });

  //TODO flaky TAST
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should successfully consume messages from queue', async () => {
    for (const fixtureToken of fixtureTokens) {
      nock(fixtureToken.tokenUri).persist().get(/.*/).reply(200, fixtureResponse);
    }
    nock('https://gateway.pinata.cloud').persist().get(/.*/).reply(200, fixtureIpfsresponse);

    nock(`http://${IPFS_GATEWAY_HOST}:${IPFS_GATEWAY_PORT}`)
      .post('/api/v0/cat')
      .query({ arg: 'QmYGPih59j1BDXPkTysE6To7WQ4uqMAqexQVrunsXjGFj7/1088.json' })
      .reply(200, fixtureIpfsresponse);

    nock(`http://${IPFS_GATEWAY_HOST}:${IPFS_GATEWAY_PORT}`).post('/api/v0/cat')
      .query({ arg: 'QmdqggiNGU1oxhjpn6t8GUrtCXSSuVmdbTz1FhtRCcnFyy/382.json' })
      .reply(200, fixtureIpfsresponse);

    for (let i = 0; i < fixtureTokens.length; i++) {
      const fixtureToken = fixtureTokens[i];
      const [ blockchain, contract, tokenId ] = fixtureToken._id.split(':');

      const metadataEvent: MetadataEventData = {
        blockchainName: blockchain as Blockchain,
        blockNumber: fixtureToken.block,
        contractAddress: contract,
        contractType: TokenStandard.ERC721,
        tokenId: tokenId,
        tokenUri: fixtureToken.tokenUri,
      };

      const observable = client.emit(ServiceEvents.READ_METADATA, metadataEvent);

      await lastValueFrom(observable);
    }

    await metadataReaderService.wg.wait();

    const metadataResult = await db.metadata().find({}).toArray();

    expect(metadataResult).toHaveLength(fixtureTokens.length);
    expect(metadataResult).toMatchSnapshot();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await db.tokens().deleteMany({});
    await db.metadata().deleteMany({});
    await db.close(true);
    await app.close();
    await client.close();
  });
});

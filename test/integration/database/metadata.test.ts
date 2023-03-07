import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { MetadataRepoDB, UriProtocol } from '@shared/metadata';
import { fixtureMetdata } from '../fixtures/fixtures.metadata';
import { Blockchain } from '@shared/blockchain';

jest.setTimeout(50000);

describe('Metadata repo', () => {
  let db: DBClass;
  beforeAll(async () => {
    const dbConfig: IDatabaseConfig = getDatabaseConfig();
    db = new DBClass({ ...dbConfig, db: `db-metadata-repo-test-${dbConfig.db}` });
    await db.open();
  });

  describe('[save] method', () => {
    it('should save a metadata document to MongoDB in metadata collection', async () => {
      const contractAddress = '0xc4545a0f49e1246bdba8601fd79412d240cfc6aa';
      const tokenId = '0xc4425a0f49e1246bdba8601fd79412d240cfc6aa';
      const id = `${Blockchain.ETH}:${contractAddress}:${tokenId}`;

      const metadataRepo = new MetadataRepoDB(db);
      const saveMetadataResult = await metadataRepo.save(id, JSON.stringify({
        image: 'https://gateway.pinata.cloud/ipfs/QmWHgFha8FLDf6jeLhGLCrHbVsprT32dtPziBektrZNsMm/7883.png',
        tokenId: tokenId,
        name: 'Superlative Mutant Ape #7883',
        attributes: [
          {
            trait_type: 'Background',
            value: 'M1 Universe',
          },
          {
            trait_type: 'Clothes',
            value: 'M1 Coat',
          },
          {
            trait_type: 'Eyes',
            value: 'M1 Yellow Suprised',
          },
          {
            trait_type: 'Fur',
            value: 'M1 Green',
          },
          {
            trait_type: 'Hat',
            value: 'M1 Cowboy Hat',
          },
          {
            trait_type: 'Mouth',
            value: 'M1 Jovial',
          },
        ],
      }), UriProtocol.HTTPS);

      const doc = await db.metadata().findOne({ _id: id });

      expect(doc).toMatchSnapshot();
      expect(saveMetadataResult).toMatchSnapshot();
    });
  });

  describe('[getWhereIdIn] method', () => {
    it('should retrieve metadata documents by ids', async () => {
      const metadataRepo = new MetadataRepoDB(db);
      const metadataItems = [
        {
          id: 'eth:0x74ba9caaa5847e142263d5F7645fFeD92e5087E5:0x017e',
          metadata: JSON.stringify({
            description: 'Born out of a bad batch of fermented ...',
            image: 'ipfs://QmbCmZ2yLMG1U24kAo1or4Kn7w6tZ3u7KEZnC3s5Jo1wQL/382.png',
          }),
          type: UriProtocol.IPFS,
        },
        {
          id: 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x5b',
          metadata: JSON.stringify({
            name: 'Braindom #2',
            description: 'COUNTDOWN OVER. MINTING LIVE.',
            image: 'ipfs://QmbCmZ2yLMG1U24kAo1or4Kn7w6tZ3u7KEZnC3s5Jo1wQL/382.png',
          }),
          type: UriProtocol.HTTPS,
        },
        {
          id: 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x72',
          metadata: JSON.stringify({
            name: 'NIKE  APE #114',
            description: 'COUNTDOWN OVER. MINTING LIVE.',
            image: 'http://gateway.pinatas.cloud/ipfs/nikebanc/(18).jpg',
          }),
          type: UriProtocol.HTTPS,
        },
      ];

      await Promise.all(metadataItems.map(({ id, metadata, type }) => metadataRepo.save(id, metadata, type)));

      const results1 = await metadataRepo.getWhereIdIn([
        'eth:0x74ba9caaa5847e142263d5F7645fFeD92e5087E5:0x017e',
        'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x72',
      ]);

      const results2 = await metadataRepo.getWhereIdIn([
        'eth:fake-contract-id:fake-token-id',
      ]);

      const results3 = await metadataRepo.getWhereIdIn([
        'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x5b',
        'eth:fake-contract-id:fake-token-id',
      ]);

      const results4 = await metadataRepo.getWhereIdIn([
        'eth:0x74ba9caaa5847e142263d5F7645fFeD92e5087E5:0x017e',
        'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x5b',
        'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x72',
      ]);

      expect(results1).toHaveLength(2);
      expect(results1).toMatchSnapshot();
      expect(results2).toHaveLength(0);
      expect(results2).toMatchSnapshot();
      expect(results3).toHaveLength(1);
      expect(results3).toMatchSnapshot();
      expect(results4).toHaveLength(3);
      expect(results4).toMatchSnapshot();
    });
  });

  describe('[getIdsWhereIdIn]', () => {
    it('should return ids of available metadata by ids', async () => {
      const metadataRepo = new MetadataRepoDB(db);
      await Promise.all(fixtureMetdata.map(({ _id, metadata, type }) => metadataRepo.save(_id, metadata, type)));

      const result1 = await metadataRepo.getIdsWhereIdIn([
        'eth:0xE1E484251ffFee048A839bc2d68C160BD8C82aBB:0x0441',
        'eth:0x8393E4fd19623660074dDd66576Ec071F2D91292:0x0340',
        'eth:0x0e28B28681B1C6b58561A97720F50176ECA387E5:0x2612',
      ]);

      const result2 = await metadataRepo.getIdsWhereIdIn([
        'eth:fake-contract-id:fake-token-id',
      ]);

      const result3 = await metadataRepo.getIdsWhereIdIn([
        'eth:0xE1E484251ffFee048A839bc2d68C160BD8C82aBB:0x0441',
        'eth:fake-contract-id:fake-token-id',
        'eth:0x8393E4fd19623660074dDd66576Ec071F2D91292:0x0340',
      ]);

      const result4 = await metadataRepo.getIdsWhereIdIn([
        'eth:0xE1E484251ffFee048A839bc2d68C160BD8C82aBB:0x0441',
        'eth:0x8393E4fd19623660074dDd66576Ec071F2D91292:0x0340',
        'eth:0x8393E4fd19623660074dDd66576Ec071F2D91292:0x0341',
        'eth:0x0e28B28681B1C6b58561A97720F50176ECA387E5:0x2612',
      ]);

      expect(result1).toMatchSnapshot();
      expect(result2).toMatchSnapshot();
      expect(result3).toMatchSnapshot();
      expect(result4).toMatchSnapshot();
    });
  });

  afterEach(async () => {
    await db.metadata().deleteMany({});
  });

  afterAll(async () => {
    await db.close(true);
  });
});

import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MetadataRepoStorage, UriProtocol } from '@shared/metadata';
import { IBaseConfig } from '@shared/baseconfig';
import { S3Provider } from '@shared/aws';

describe('Metadata Storage repo', () => {
  let s3Provider: S3Provider<IBaseConfig>;
  let bucketName: string;
  beforeAll(async () => {
    s3Provider = new S3Provider(new ConfigService<IBaseConfig, false>());
    bucketName = `metadata-${uuidv4()}`;
    await s3Provider.storage.createBucket({ Bucket: bucketName }).promise();
  });

  describe('[save] method', () => {
    it('should save a metadata document to MongoDB in metadata collection', async () => {
      const metadataRepo = new MetadataRepoStorage(s3Provider, bucketName);
      const metadataItems = [
        {
          id: 'eth:0x74ba9caaa5847e142263d5F7645fFeD92e5087E5:0x017e',
          metadata: JSON.stringify({
            description: 'Born out of a bad batch of fermented ...',
            image: 'ipfs://QmbCmZ2yLMG1U24kAo1or4Kn7w6tZ3u7KEZnC3s5Jo1wQL/382.png',
          }),
        },
        {
          id: 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x5b',
          metadata: JSON.stringify({
            name: 'Braindom #2',
            description: 'COUNTDOWN OVER. MINTING LIVE.',
            image: 'ipfs://QmbCmZ2yLMG1U24kAo1or4Kn7w6tZ3u7KEZnC3s5Jo1wQL/382.png',
          }),
        },
        {
          id: 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x72',
          metadata: JSON.stringify({
            name: 'NIKE  APE #114',
            description: 'COUNTDOWN OVER. MINTING LIVE.',
            image: 'http://gateway.pinatas.cloud/ipfs/nikebanc/(18).jpg',
          }),
        },
      ];

      await Promise.all(metadataItems.map(({ id, metadata }) => metadataRepo.save(id, metadata, UriProtocol.HTTPS)));

      let objectExist;
      objectExist = await s3Provider.objectExist(bucketName, 'eth:0x74ba9caaa5847e142263d5F7645fFeD92e5087E5:0x017e.json');
      expect(objectExist).toBe(true);
      objectExist = await s3Provider.objectExist(bucketName, 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x5b.json');
      expect(objectExist).toBe(true);
      objectExist = await s3Provider.objectExist(bucketName, 'eth:0x000386E3F7559d9B6a2F5c46B4aD1A9587D59Dc3:0x72.json');
      expect(objectExist).toBe(true);
    });
  });

  describe('[getWhereIdIn] method', () => {
    it('should retrieve metadata documents by ids', async () => {
      const metadataRepo = new MetadataRepoStorage(s3Provider, bucketName);
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
});

import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { S3Provider } from '@shared/aws';
import { IBaseConfig } from '@shared/baseconfig';

jest.setTimeout(40000);

describe('S3 provider tests', () => {
  let s3Provider: S3Provider<IBaseConfig>;
  let bucketName: string;

  beforeAll(async () => {
    s3Provider = new S3Provider(new ConfigService<IBaseConfig, false>());
    bucketName = `metadata-${uuidv4()}`;
    await s3Provider.storage.createBucket({ Bucket: bucketName }).promise();
  });

  it('test emptyFolder', async () => {
    const files = [
      {
        key: 'file1.txt',
        body: 'test file1 content',
      },
      {
        key: 'file2.txt',
        body: 'test file1 content',
      },
      {
        key: 'file3.txt',
        body: 'test file1 content',
      },
    ];
    await Promise.all(files.map(async (file) =>  s3Provider.storage.putObject({
      Bucket: bucketName,
      Key: file.key,
      Body: Buffer.from(file.body, 'utf-8'),
    }).promise()));

    let objectExist: boolean;
    let listObjects;

    objectExist = await s3Provider.objectExist(bucketName, files[0].key);
    expect(objectExist).toBe(true);
    objectExist = await s3Provider.objectExist(bucketName, files[1].key);
    expect(objectExist).toBe(true);
    objectExist = await s3Provider.objectExist(bucketName, files[2].key);
    expect(objectExist).toBe(true);

    listObjects = await s3Provider.storage.listObjectsV2({
      Bucket: bucketName,
      Delimiter: '/',
      Prefix: '',
      MaxKeys: 100,
    }).promise();
    expect(listObjects).toHaveProperty('Contents');
    expect(listObjects.Contents).toHaveLength(3);

    await s3Provider.emptyFolder(bucketName, '');

    listObjects = await s3Provider.storage.listObjectsV2({
      Bucket: bucketName,
      Delimiter: '/',
      Prefix: '',
      MaxKeys: 100,
    }).promise();
    expect(listObjects).toHaveProperty('Contents');
    expect(listObjects.Contents).toHaveLength(0);
  });

  afterAll(async () => {
    await s3Provider.storage.deleteBucket({ Bucket: bucketName }).promise();
  });
});

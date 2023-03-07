import { fixtureResponse } from '../fixtures/fixture.response';
import nock from 'nock';
import { HttpReader } from '@shared/metadata';

jest.setTimeout(100000);

const uris = [
  'https://gateway.pinata.cloud/ipfs/Qmdv7R7C14NqHPLPyQdcCY613w5trQyKHfBsegutRuANF4/7883.json',
  'http://api.braindom.xyz/ipfs/18',
  'https://bapesclan.mypinata.cloud/ipfs/QmZZbo8u8zEWg7wtmZhJS2W718WL6FA95T4XdgmCcLp1SJ/1863.json',
];

describe('[http-metadata-reader]', () => {
  beforeEach(() => {
    for (const uri of uris) {
      nock(uri).get('').reply(200, fixtureResponse);
    }
  });

  it('should download metadata by tokenUri via http request', async () => {
    const result = await Promise.all(uris.map((uri) => new HttpReader().read(uri)));
    result.forEach((item) => {
      expect(typeof item === 'string').toBeTruthy();
    });
    expect(result).toMatchSnapshot();
  });

  afterEach(() => {
    nock.cleanAll();
  });
});

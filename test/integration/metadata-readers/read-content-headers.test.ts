import {
  firstHeadResponseFixture,
  fourthHeadResponseFixture,
  secondHeadResponseFixture,
  thirdHeadResponseFixture,
} from '../fixtures/head-response.fixture';
import { ContentHeaders, readContentHeaders } from '@shared/metadata';
import nock, { ReplyHeaders } from 'nock';

jest.setTimeout(100000);

const tokenUrisMap = new Map<string, ReplyHeaders>([
  [ 'https://ipfs.io/ipfs/QmRdbJbYsB3CXufZ4CoPRHMFE8nJ8NXPPmijD5BVzT86qL', firstHeadResponseFixture ],
  [ 'https://tag-metadata.herokuapp.com/mutants/832', secondHeadResponseFixture ],
  [ 'https://assets.weedgang.game/genesis-strains/metadata/3615', thirdHeadResponseFixture ],
]);

const tokenUriWithoutContentLength = 'https://azimuth.network/erc721/1953660440.json';

describe('[read-content-headers]', () => {
  it('should get metadata content headers by tokenUri via head request', async () => {
    const result = new Map<string, ContentHeaders>();

    for (const [ tokenUri, headResponse ] of tokenUrisMap) {
      nock(tokenUri).head('').reply(200, { statusText: 'OK' }, headResponse);
      const contentHeaders = await readContentHeaders(tokenUri);
      result.set(tokenUri, contentHeaders);
    }

    result.forEach((contentHeaders) => {
      expect(typeof contentHeaders.type === 'string').toBeTruthy();
      expect(typeof contentHeaders.length === 'number').toBeTruthy();
    });

    expect(result).toMatchSnapshot();
  });

  it('should get metadata content headers even if there is no "content-length" header', async () => {
    nock(tokenUriWithoutContentLength).head('').reply(200, { statusText: 'OK' }, fourthHeadResponseFixture);
    const result = await readContentHeaders(tokenUriWithoutContentLength);

    expect(typeof result.type === 'string').toBeTruthy();
    expect(result.length).toBeNull();

    expect(result).toMatchSnapshot();
  });

  afterEach(async () => {
    nock.cleanAll();
  });
});

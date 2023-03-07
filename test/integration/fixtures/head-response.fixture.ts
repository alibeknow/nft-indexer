import { ReplyHeaders } from 'nock';

export const firstHeadResponseFixture: ReplyHeaders = new Map<string, string>([
  [ 'content-type', 'image/jpeg' ],
  [ 'content-length', '10749707' ],
]);

export const secondHeadResponseFixture: ReplyHeaders = new Map<string, string>([
  [ 'content-type', 'application/json; charset=utf-8' ],
  [ 'content-length', '344' ],
]);

export const thirdHeadResponseFixture: ReplyHeaders = new Map<string, string>([
  [ 'content-type', 'binary/octet-stream' ],
  [ 'content-length', '1103' ],
]);

export const fourthHeadResponseFixture: ReplyHeaders = new Map<string, string>([
  [ 'content-type', 'application/json' ],
]);

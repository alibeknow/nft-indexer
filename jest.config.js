'use strict';

module.exports = {
  rootDir: './',
  automock: false,
  preset: 'ts-jest',
  clearMocks: true,
  collectCoverage: true,
  verbose: true,
  silent: false,
  maxWorkers: '50%',
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  moduleFileExtensions: [ 'ts', 'js', 'json', 'node' ],
  testPathIgnorePatterns: [ '/node_modules/', '__snapshots__' ],
  testMatch: [ '**/test/**/*.test.[jt]s' ],
  moduleNameMapper: {
    '@api/(.*)': '<rootDir>/src/api/$1',
    '@app-events-reader/(.*)': '<rootDir>/src/app-events-reader/$1',
    '@app-indexer/(.*)': '<rootDir>/src/app-indexer/$1',
    '@app-metadata-reader/(.*)': '<rootDir>/src/app-metadata-reader/$1',
    '@shared/(.*)': '<rootDir>/src/shared/$1',
    '@contract-reader/(.*)': '<rootDir>/src/contract-reader/$1',
    '@app-contract-reader/(.*)': '<rootDir>/src/app-contract-reader/$1',
    '@app-cryptopunks/(.*)': '<rootDir>/src/app-cryptopunks/$1',
    '@app-refresh/(.*)': '<rootDir>/src/app-refresh/$1',
  },
};

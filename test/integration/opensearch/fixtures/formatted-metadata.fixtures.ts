import { IMetadataIndex, mapToSearchIndex } from '@shared/metadata';
import { fixtureMetdata } from '../../fixtures/fixtures.metadata';

export const formattedMetadata = fixtureMetdata.map(({ _id, metadata, type }) => {
  return mapToSearchIndex({ _id, metadata, type }) as IMetadataIndex;
});

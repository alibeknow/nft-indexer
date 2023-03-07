import { OpenseaCollectionImageResponse } from '@shared/opensea';

export const openseaClientCollectionImageResponse: OpenseaCollectionImageResponse = {
  collection: {
    featured_image_url: String(Math.random()),
    image_url: String(Math.random()),
  },
};

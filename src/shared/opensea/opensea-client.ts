import { logger } from '@shared/logger';
import { IOpenseaConfig } from '@shared/opensea/opensea.config';
import axios from 'axios';
import * as retry from 'retry';

export interface OpenseaCollectionImageResponse {
  collection: {
    featured_image_url: string;
    image_url: string;
  };
}

export class OpenseaClient {
  private readonly apiUri: string;
  private readonly apiKey: string;

  /**
   * OpenseaClient constructor
   */
  constructor(private config: IOpenseaConfig) {
    this.apiUri = this.config.uri as string;
    this.apiKey = this.config.api_key as string;
  }

  /**
   * Makes request to Opensea API endpoint to get collection image
   */
  public async getOpenseaCollectionImageUrl(contractAddress: string): Promise<string> {
    let imageUrl = '';
    const uri = `${this.apiUri}/${contractAddress}`;

    const operation = retry.operation({
      retries: 4,
      minTimeout: 100,
      maxTimeout: 1000,
    });

    return new Promise((resolve, reject) => {
      operation.attempt(async () => {
        try {
          const { data } = await axios.get<OpenseaCollectionImageResponse>(uri, {
            headers: { 'X-API-KEY': this.apiKey },
          });
          imageUrl = data.collection.featured_image_url || data.collection.image_url;

          return resolve(imageUrl);
        } catch (err) {
          logger.error({
            msg: `Error requesting collection image by address: ${contractAddress}`,
            err,
          });

          if (operation.retry(err as Error)) {
            // Should retry
            return;
          }

          return reject('');
        }
      });
    });
  }
}

import { logger } from '@shared/logger';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import ProxyAgent from 'https-proxy-agent';
import * as retry from 'retry';
import { HTTP_READER_MAX_TIMEOUT, HTTP_READER_MIN_TIMEOUT } from './constants';

/**
 * Http Reader
 */
export class HttpReader {
  private readonly axiosRequestConfig: AxiosRequestConfig;

  private readonly retries: number;

  constructor(retries = 0, proxyCredentials?: string, requestTimeout?: number) {
    this.axiosRequestConfig = { transformResponse: [], timeout: requestTimeout || 0, proxy: false };
    this.retries = retries;

    if (proxyCredentials) {
      this.axiosRequestConfig.httpsAgent = new ProxyAgent.HttpsProxyAgent(proxyCredentials);
    }
  }

  /**
   * Asynchronously read metadata via http/https protocol
   *
   * @example <caption> Read metadata using http/https link </caption>
   * await httpReader.read('https://storage.mypinata.cloud/ipfs/.../4', 1000);
   *
   * @param {string} tokenUri https/http link
   * @param {number} requestTimeout (optional) request timeout (in milliseconds)
   * @returns {Promise<string>} metadata
   */
  async read(tokenUri: string): Promise<string> {
    const operation = retry.operation({
      retries: this.retries,
      minTimeout: HTTP_READER_MIN_TIMEOUT,
      maxTimeout: HTTP_READER_MAX_TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      operation.attempt(async (currentAttempt: number) => {
        try {
          const result: AxiosResponse = await axios.get<string>(tokenUri, this.axiosRequestConfig);
          resolve(result.data);
        } catch (e) {
          // @ts-ignore
          if (operation.retry(e as unknown as Error) && e?.response?.status === 429) {
            logger.error({
              msg: `Error requesting tokenURI: ${tokenUri} (Attempt #${currentAttempt}): ${e}. Retrying...`,
            });

            return;
          }

          reject(operation.mainError());
        }
      });
    });
  }
}

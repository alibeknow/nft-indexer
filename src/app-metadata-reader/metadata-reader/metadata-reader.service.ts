import client from 'prom-client';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '@shared/logger';
import { registry } from '@shared/metrics';
import {
  HttpReader,
  IMetadataRepo,
  METADATA_REPO_PROVIDER,
  PinataConvertedURL,
  ReaderInterface,
  UriProtocol,
  convertIPFStoPinataURL,
  ipfsGatewayHttpReader,
  ipfsHttpReader,
  onChainReader,
} from '@shared/metadata';
import { Token, TokenMetadataStatus, TokensRepo } from '@shared/tokens';
import { WaitGroup } from '@shared/wg';
import { MetadataEventData } from '@shared/microservices';
import { IMetadataReaderConfig, IServiceConfig } from '../app.config';

const wgTasksGauge = new client.Gauge({
  name: 'tasks_gauge',
  help: 'tasks gauge',
  registers: [ registry ],
});
const getTokensGauge = new client.Gauge({
  name: 'get_tokens_gauge',
  help: 'get tokens gauge',
  registers: [ registry ],
});
const tokensGauge = new client.Gauge({
  name: 'tokens_gauge',
  help: 'tokens gauge',
  registers: [ registry ],
});
const tokenCounter = new client.Counter({
  name: 'token_counter',
  help: 'token counter',
  registers: [ registry ],
});
const metadataCounter = new client.Counter({
  name: 'metadata_counter',
  help: 'metadata counter',
  registers: [ registry ],
});
const ipfsMetadataGauge = new client.Gauge({
  name: 'ipfs_metadata_gauge',
  help: 'ipfs metadata gauge',
  registers: [ registry ],
});
const httpMetadataGauge = new client.Gauge({
  name: 'http_metadata_gauge',
  help: 'http metadata gauge',
  registers: [ registry ],
});
const onChainMetadataGauge = new client.Gauge({
  name: 'on_chain_metadata_gauge',
  help: 'on chain metadata gauge',
  registers: [ registry ],
});
const ipfsMetadataCount = new client.Gauge({
  name: 'ipfs_metadata_count',
  help: 'ipfs metadata count',
  registers: [ registry ],
});
const pinataMetadataCount = new client.Gauge({
  name: 'pinata_metadata_count',
  help: 'pinata metadata count',
  registers: [ registry ],
});
const pinataMetadataGauge = new client.Gauge({
  name: 'pinata_metadata_gauge',
  help: 'pinata metadata gauge',
  registers: [ registry ],
});
const convertedURLCounter = new client.Gauge({
  name: 'pinata_convertedURL_count',
  help: 'pinata converted URL count',
  registers: [ registry ],
});
const httpMetadataCount = new client.Gauge({
  name: 'http_metadata_count',
  help: 'http metadata count',
  registers: [ registry ],
});
const onChainMetadataCount = new client.Gauge({
  name: 'on_chain_metadata_count',
  help: 'on chain metadata count',
  registers: [ registry ],
});
const totalIpfsMetadataCount = new client.Gauge({
  name: 'total_ipfs_metadata_count',
  help: 'total ipfs metadata count',
  registers: [ registry ],
});
const totalHttpMetadataCount = new client.Gauge({
  name: 'total_http_metadata_count',
  help: 'total http metadata count',
  registers: [ registry ],
});
const totalOnChainMetadataCount = new client.Gauge({
  name: 'total_on_chain_metadata_count',
  help: 'total on chain metadata count',
  registers: [ registry ],
});
const storeMetadataGauge = new client.Gauge({
  name: 'store_metadata_gauge',
  help: 'store metadata gauge',
  registers: [ registry ],
});

/**
 * Metadata Reader Service
 */
@Injectable()
export class MetadataReaderService {
  readonly wg: WaitGroup;
  private usePinata: boolean;
  private pinataRetries: number;
  private pinataDedicatedGatewayFallback?: string;
  private ipfsGatewayFallback: boolean;
  private defaultGateway: string;
  private dateOfLastCheckedToken = new Date(0);
  private proxyCredentials?: string;
  private requestTimeout?: number;

  constructor(
    private readonly tokens: TokensRepo,
    @Inject(METADATA_REPO_PROVIDER) private readonly metadata: IMetadataRepo,
    private readonly configService: ConfigService<IMetadataReaderConfig>,
  ) {
    const serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;

    this.wg = WaitGroup.withGauge(serviceConfig.workersCount, wgTasksGauge);
    this.usePinata = serviceConfig.usePinata;
    this.pinataRetries = serviceConfig.pinataRetries;
    this.pinataDedicatedGatewayFallback = serviceConfig.pinataDedicatedGatewayFallback;
    this.ipfsGatewayFallback = serviceConfig.ipfsGatewayFallback;
    this.defaultGateway = serviceConfig.defaultGateway;
    this.proxyCredentials = serviceConfig.proxyCredentials;
    this.requestTimeout = serviceConfig.requestTimeout;
  }

  /**
   * Asynchronously read metadata via tokenUris and store them to "metadata" collection
   * or AWS Bucket. Token uris are taken from the "tokens" collection
   *
   * @example <caption> Asynchronously read 10 records via 5 workers </caption>
   * await metadataReaderService.read(10, 5)
   *
   * @param {number} batchLimit Maximum number of tokens retrieved from DB at once
   * @param {number} workers Number of async workers to process tokens metadata
   *
   * @returns {Promise<number>} Number of tokens were actually read from DB
   */
  public async read(batchLimit: number, workers: number): Promise<number> {
    const wg = WaitGroup.withGauge(workers, wgTasksGauge);

    let tokens: Token[] = [];

    const end = getTokensGauge.startTimer();
    tokens = await this.tokens.getCreatedAfter(this.dateOfLastCheckedToken, batchLimit);
    end();

    if (!tokens.length) {
      logger.info('No new unchecked tokens');

      return 0;
    }

    logger.info(`Found ${tokens.length} new unchecked tokens`);
    tokensGauge.set(tokens.length);

    for (const token of tokens) {
      if (!token.tokenUri) continue;

      tokenCounter.inc(1);

      let reader: ReaderInterface;
      let httpReader: HttpReader;
      let protocolGauge: client.Gauge<string>;
      let protocolCounter: client.Gauge<string>;
      let tokenMetadataStatus = TokenMetadataStatus.AVAILABLE;

      let uri = token.tokenUri;
      const originalUri = token.tokenUri;
      let convertedURL: PinataConvertedURL | undefined;
      let protocol: string;

      protocol = uri.split(':')[0];
      const originalProtocol = protocol;

      if (this.usePinata) {
        switch(protocol) {
        case UriProtocol.HTTP:
        case UriProtocol.HTTPS:
        case UriProtocol.IPFS:
          convertedURL = convertIPFStoPinataURL(uri, this.defaultGateway);
          if (convertedURL.ok) {
            uri = convertedURL.url;
            convertedURLCounter.inc(1);
            protocol = uri.split(':')[0];
          }
        }
      }

      switch (protocol) {
      case UriProtocol.IPFS:
        totalIpfsMetadataCount.inc();
        reader = ipfsHttpReader;
        protocolGauge = ipfsMetadataGauge;
        protocolCounter = ipfsMetadataCount;
        break;
      case UriProtocol.HTTP:
      case UriProtocol.HTTPS:
        totalHttpMetadataCount.inc();
        httpReader = new HttpReader(this.usePinata ? (this.pinataRetries ? this.pinataRetries : 0) : 0, this.proxyCredentials, this.requestTimeout);
        reader = httpReader.read.bind(httpReader);
        protocolGauge = httpMetadataGauge;
        protocolCounter = httpMetadataCount;
        break;
      case UriProtocol.DATA:
        totalOnChainMetadataCount.inc();
        reader = onChainReader;
        protocolGauge = onChainMetadataGauge;
        protocolCounter = onChainMetadataCount;
        break;
      default:
        logger.info(`Unknown protocol of URI. ${uri}`);
        continue;
      }

      if (convertedURL?.ok) {
        protocolCounter = pinataMetadataCount;
        protocolGauge = pinataMetadataGauge;
      }

      await wg.go(async () => {
        let data: string;

        let end = protocolGauge.startTimer();
        try {
          data = await reader(uri);
        } catch (e) {
          // @ts-ignore
          if(this.usePinata && protocol === UriProtocol.HTTPS && originalProtocol === UriProtocol.IPFS && e?.response?.status === 429 &&
            convertedURL && convertedURL.ok
          ) {
            let processed = false;

            if (this.ipfsGatewayFallback) {
              // @ts-ignore
              logger.info({
                token: token._id,
                tokenUri: uri,
                originalUri: originalUri,
                msg: 'Rate limit error. Fallback on ipfs gateway...',
              });

              try {
                data = await ipfsGatewayHttpReader(originalUri);
                processed = true;
              } catch (e) {
                logger.error({
                  msg: 'Error requesting token metadata via ipfs gateway fallback',
                  blockNumber: token.block,
                  token: token._id,
                  uri: uri,
                  originalUri: originalUri,
                  type: protocol,
                  error: e,
                });
              }
            }

            if (this.pinataDedicatedGatewayFallback && !processed) {
              logger.info({
                msg: 'Ipfs gateway fallback error. Fallback on pinata dedicated gateway...',
                blockNumber: token.block,
                token: token._id,
                uri: uri,
                originalUri: originalUri,
                type: protocol,
                error: e,
              });

              convertedURL = convertIPFStoPinataURL(uri, this.pinataDedicatedGatewayFallback);

              try {
                if (convertedURL.ok) {
                  uri = convertedURL.url;
                  data = await reader(uri);
                  processed = true;
                } else {
                  logger.error({
                    msg: 'Conversion error during pinata dedicated gateway fallback',
                    blockNumber: token.block,
                    token: token._id,
                    uri: uri,
                    originalUri: originalUri,
                    type: protocol,
                    error: e,
                  });
                }
              } catch (e) {
                logger.error({
                  msg: 'Error requesting token metadata via pinata dedicated gateway fallback',
                  blockNumber: token.block,
                  token: token._id,
                  uri: uri,
                  originalUri: originalUri,
                  type: protocol,
                  error: e,
                });
              }
            }

            if (!processed) {
              tokenMetadataStatus = TokenMetadataStatus.RECEIVABLE;
            }
          } else {
            tokenMetadataStatus = TokenMetadataStatus.UNAVAILABLE;
            logger.error({
              msg: 'Error processing token metadata',
              blockNumber: token.block,
              token: token._id,
              uri: uri,
              type: protocol,
              error: e,
            });
          }

          return;
        } finally {
          end();
        }

        protocolCounter.inc(1);
        metadataCounter.inc(1);

        end = storeMetadataGauge.startTimer();
        try {
          await this.metadata.save(token._id, data, <UriProtocol>protocol);
        } catch (e) {
          logger.error({
            msg: 'Error storing token metadata into Storage',
            blockNumber: token.block,
            token: token._id,
            uri: uri,
            type: protocol,
            error: e,
          });
        } finally {
          end();
        }

        try {
          await this.tokens.updateUnavailability(token._id, tokenMetadataStatus);
        } catch (e) {
          logger.error({
            msg: 'Error updating token unavailability',
            blockNumber: token.block,
            token: token._id,
            uri: uri,
            type: protocol,
            tokenMetadataStatus,
            error: e,
          });
        } finally {
          end();
        }
      });
    }

    await wg.wait();
    this.dateOfLastCheckedToken = tokens[tokens.length - 1].createdAt;

    return tokens.length;
  }

  /**
   * Asynchronously read metadata from event and store them to database or AWS Bucket
   * @param {MetadataEventData} metadataEvent Object consists of all the necessary token data
   */
  public async readOne(metadataEvent: MetadataEventData): Promise<void> {
    const { blockchainName, blockNumber, contractAddress, tokenId, tokenUri } = metadataEvent;
    const tokenRef = `${blockchainName}:${contractAddress}:${tokenId}`;
    tokenCounter.inc(1);

    if (!tokenUri) {
      logger.debug({
        msg: 'Skipping reading metadata due to empty token uri',
        blockNumber: blockNumber,
        token: tokenRef,
      });

      return;
    }

    let reader: ReaderInterface;
    let httpReader: HttpReader;
    let protocolGauge: client.Gauge<string>;
    let protocolCounter: client.Gauge<string>;
    let tokenMetadataStatus = TokenMetadataStatus.AVAILABLE;

    let uri = tokenUri;
    const originalUri = tokenUri;
    let convertedURL: PinataConvertedURL | Record<string, never> = {};
    let protocol: string;

    protocol = uri.split(':')[0];
    const originalProtocol = protocol;

    if (this.usePinata) {
      switch(protocol) {
      case UriProtocol.HTTP:
      case UriProtocol.HTTPS:
      case UriProtocol.IPFS:
        convertedURL = convertIPFStoPinataURL(uri, this.defaultGateway);
        if (convertedURL.ok) {
          uri = convertedURL.url;
          convertedURLCounter.inc(1);
          protocol = uri.split(':')[0];
        }
      }
    }

    switch (protocol) {
    case UriProtocol.IPFS:
      totalIpfsMetadataCount.inc();
      reader = ipfsHttpReader;
      protocolGauge = ipfsMetadataGauge;
      protocolCounter = ipfsMetadataCount;
      break;
    case UriProtocol.HTTP:
    case UriProtocol.HTTPS:
      totalHttpMetadataCount.inc();
      httpReader = new HttpReader(this.usePinata ? (this.pinataRetries ? this.pinataRetries : 0) : 0, this.proxyCredentials, this.requestTimeout);
      reader = httpReader.read.bind(httpReader);
      protocolGauge = httpMetadataGauge;
      protocolCounter = httpMetadataCount;
      break;
    case UriProtocol.DATA:
      totalOnChainMetadataCount.inc();
      reader = onChainReader;
      protocolGauge = onChainMetadataGauge;
      protocolCounter = onChainMetadataCount;
      break;
    default:
      logger.info(`Unknown protocol of URI. ${uri}`);

      return;
    }

    if (convertedURL?.ok) {
      protocolCounter = pinataMetadataCount;
      protocolGauge = pinataMetadataGauge;
    }

    await this.wg.go(async () => {
      let data: string;

      let end = protocolGauge.startTimer();
      try {
        data = await reader(uri);
      } catch (e) {
        // @ts-ignore
        if(this.usePinata && protocol === UriProtocol.HTTPS && originalProtocol === UriProtocol.IPFS && e?.response?.status === 429 &&
          convertedURL && convertedURL.ok
        ) {
          let processed = false;

          if (this.ipfsGatewayFallback) {
            // @ts-ignore
            logger.info({
              token: tokenRef,
              tokenUri: uri,
              originalUri: originalUri,
              msg: 'Rate limit error. Fallback on ipfs gateway...',
            });

            try {
              data = await ipfsGatewayHttpReader(originalUri);
              processed = true;
            } catch (e) {
              logger.error({
                msg: 'Error requesting token metadata via ipfs gateway fallback',
                blockNumber: blockNumber,
                token: tokenRef,
                uri: tokenUri,
                originalUri: originalUri,
                type: protocol,
                error: e,
              });
            }
          }

          if (this.pinataDedicatedGatewayFallback && !processed) {
            logger.info({
              msg: 'Rate limit error. Fallback on pinata dedicated gateway...',
              blockNumber: blockNumber,
              token: tokenRef,
              uri: uri,
              type: protocol,
              error: e,
            });

            convertedURL = convertIPFStoPinataURL(uri, this.pinataDedicatedGatewayFallback);

            try {
              if (convertedURL.ok) {
                uri = convertedURL.url;
                data = await reader(uri);
                processed = true;
              } else {
                logger.error({
                  msg: 'Conversion error during pinata dedicated gateway fallback',
                  blockNumber: blockNumber,
                  token: tokenRef,
                  uri: tokenUri,
                  originalUri: originalUri,
                  type: protocol,
                  error: e,
                });
              }
            } catch (e) {
              logger.error({
                msg: 'Error requesting token metadata via pinata dedicated gateway fallback',
                blockNumber: blockNumber,
                token: tokenRef,
                uri: tokenUri,
                originalUri: originalUri,
                type: protocol,
                error: e,
              });
            }
          }

          if (!processed) {
            tokenMetadataStatus = TokenMetadataStatus.RECEIVABLE;
          }

        } else {
          tokenMetadataStatus = TokenMetadataStatus.UNAVAILABLE;
          logger.error({
            msg: 'Error processing token metadata',
            blockNumber: blockNumber,
            token: tokenRef,
            uri: uri,
            type: protocol,
            error: e,
          });
        }

        try {
          await this.tokens.updateUnavailability(tokenRef, tokenMetadataStatus);

          if (tokenMetadataStatus === TokenMetadataStatus.UNAVAILABLE ||
              tokenMetadataStatus === TokenMetadataStatus.RECEIVABLE) {
            await this.tokens.updateRetryCount(tokenRef);
          }
        } catch (e) {
          logger.error({
            msg: 'Error updating token unavailability',
            blockNumber: blockNumber,
            token: tokenRef,
            uri: uri,
            type: protocol,
            tokenMetadataStatus,
            error: e,
          });
        }

        return;
      } finally {
        end();
      }

      protocolCounter.inc(1);
      metadataCounter.inc(1);

      end = storeMetadataGauge.startTimer();
      try {
        await this.metadata.save(tokenRef, data, <UriProtocol>protocol);
      } catch (e) {
        logger.error({
          msg: 'Error storing token metadata into Storage',
          blockNumber: blockNumber,
          token: tokenRef,
          uri: uri,
          type: protocol,
          error: e,
        });
      } finally {
        end();
      }

      try {
        await this.tokens.updateUnavailability(tokenRef, tokenMetadataStatus);
      } catch (e) {
        logger.error({
          msg: 'Error updating token unavailability',
          blockNumber: blockNumber,
          token: tokenRef,
          uri: uri,
          type: protocol,
          tokenMetadataStatus,
          error: e,
        });
      } finally {
        end();
      }
    });
  }
}

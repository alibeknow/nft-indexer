import { IStaxStatisticsConfig } from '../app.config';
import { IOpensearchSearchWhereFieldParams, OpensearchProvider } from '@shared/opensearch';
import { logger } from '@shared/logger';
import { IMetadataIndex } from '@shared/metadata';
import { Readable, ReadableOptions } from 'stream';
import { ethers } from 'ethers';

export interface Options extends ReadableOptions {
  indexName: string;
  params: IOpensearchSearchWhereFieldParams;
}

export class OpenSearchWhereFieldAuxiliary extends Readable {
  public total: number;
  private from: number;
  private lastProcessed: string;

  constructor(
    private readonly opensearchProvider: OpensearchProvider<IStaxStatisticsConfig>,
    private readonly options: Options,
  ) {
    super(options);
    this.total = 0;
    this.from = 0;
    this.lastProcessed = '';
    this.options.params.from = -1;
    this.options.params.size ??= 100;
  }

  async _read() {
    this.options.params.searchAfter = [ this.lastProcessed ];

    const results = await this.opensearchProvider
      .searchWhereFieldExists<IMetadataIndex>(
        this.options.indexName, {
          ...this.options.params,
          searchAfter: [ this.lastProcessed ],
        });

    results.hits.map(value => {
      this.lastProcessed = value.id as string;
      if (!this.lastProcessed) return;
      const [ , contractAddress, tokenId ] = this.lastProcessed.split(':');
      this.push(`${contractAddress},${ethers.BigNumber.from(tokenId)}\n`);
    });
    this.total += results.hits.length;

    const size = this.total - this.from;
    logger.debug(`Processing data of size ${size}: from - ${this.from}, to - ${this.total}.`);
    this.from += size;

    if (!results.hits.length) {
      logger.info(`Processing is finished. Total ${this.total} document(s)`);
      this.push(null);
    }
  }
}

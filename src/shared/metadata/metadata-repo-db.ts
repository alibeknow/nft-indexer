import { Inject, Injectable } from '@nestjs/common';
import { InsertOneResult } from 'mongodb';
// TODO Replace deprecated DB provider to DBProvider
import { DB } from '@shared/db';
import { MetadataId, UriProtocol } from '@shared/metadata';
import { IDB, IMetadataRepo, Metadata } from './interfaces';

@Injectable()
export class MetadataRepoDB implements IMetadataRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  /**
   * Recieve paginated metadata list
   *
   * @example
   * await getMetadataList(0, 'eth:XXXXXX')
   *
   * @param {number} limit limit of metadata in result
   * @param {string} fromId from what metadata start fetching
   * @returns {Promise<Metadata[]>} array of metatada
   */
  public async getMetadataList(limit: number, fromId?: string): Promise<Metadata[]> {
    let where = {};

    if (fromId) {
      where = { _id: { $gt: fromId } };
    }

    const cursor = this.db.metadata().find<Metadata>(where).sort({ _id: 1 }).limit(limit);

    return cursor.toArray();
  }

  /**
   * Recieve metadata list by array of identifiers
   *
   * @example
   * await getWhereIdIn(['eth:0x9FB2EEb757...a5dc404f:f12', 'eth:0x9FB2EEb757...a5dc404f:d21'])
   *
   * @param {string[]} ids array of token identifiers
   * @returns {Promise<Metadata[]>} array of metatada
   */
  public async getWhereIdIn(ids: string[]): Promise<Metadata[]> {
    const cursor = this.db.metadata().find<Metadata>({
      _id: { '$in': ids },
    });

    return cursor.toArray();
  }

  public async getIdsWhereIdIn(ids: string[]): Promise<MetadataId[]> {
    const cursor = this.db.metadata().find<MetadataId>({
      _id: { '$in': ids },
    })
      .project<MetadataId>({ metadata: 0, type: 0 });

    return cursor.toArray();
  }

  /**
   * Save metadata to "metadata" collection
   *
   * @example
   * await save('eth:0x9FB2EEb757...a5dc404f:f12', 'metadata', 'protocol')
   *
   * @param {string} tokenId identifier of given token
   * @param {string} metadata token metadata
   * @param {boolean} isUnavailable is metadata unavailable
   * @param {string} protocol uri protocol
   * @returns {Promise<Metadata>} result of insertion
   */
  public async save(tokenId: string, metadata: string, protocol: UriProtocol): Promise<Metadata | null> {
    const metadataItem: Metadata = {
      _id: tokenId,
      metadata,
      type: protocol,
    };
    const result: InsertOneResult = await this.db.metadata().insertOne(metadataItem);

    if (result.insertedId) {
      return metadataItem;
    }

    return null;
  }
}

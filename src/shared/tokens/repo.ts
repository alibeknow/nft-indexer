import { Inject, Injectable } from '@nestjs/common';
import { Collection, InsertOneResult, UpdateResult, WithId } from 'mongodb';
// TODO Replace deprecated DB provider to DBProvider
import { DB } from '@shared/db';
import { Blockchain } from '../blockchain';
import { MongoSort } from '../db';
import { TokenMetadataStatus } from './token-metadata-status';

export type Token = {
  _id: string;
  block: number;
  tokenUri: string | null;
  count: number;
  from: string;
  tokenMetadataStatus: TokenMetadataStatus;
  retryCount: number;
  createdAt: Date;
  updatedAt?: Date | null;
};

interface IDB {
  tokens(): Collection<Token>;
}

export type TokenAttributes = {
  blockchain: Blockchain;
  contractAddress: string;
  tokenId: string;
  block: number;
  tokenUri: string;
  count: number;
  from: string;
  retryCount?: number;
  createdAt: Date;
};

/**
 * Tokens Repository (Injectable class)
 */
@Injectable()
export class TokensRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  /**
   * Recieve tokens list by array of identifiers
   *
   * @example
   * await getWhereIdIn(['eth:0x9FB2EEb757...a5dc404f:f12', 'eth:0x9FB2EEb757...a5dc404f:d21'])
   *
   * @param {string[]} ids array of token identifiers
   * @returns {Promise<Token[]>} array of tokens
   */
  public async getWhereIdIn(ids: string[]): Promise<Token[]> {
    const cursor = this.db.tokens().find<Token>({
      _id: { '$in': ids },
    });

    return cursor.toArray();
  }

  /**
   * Asynchronously get token by id
   * @param {string} id token id
   * @returns {Promise<Token | null>} token or null
   */
  public async getById(id: string): Promise<Token | null> {
    return this.db.tokens().findOne<Token>({
      _id: id,
    });
  }

  /**
   * Update uri of token
   * @param {string} id token id
   * @param {string} tokenUri new token uri
   * @returns {Promise<UpdateResult>} result of update
   */
  public updateUri(id: string, tokenUri: string): Promise<UpdateResult>  {
    return this.db.tokens().updateOne({ _id: id }, {
      $set: {
        tokenUri,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get all tokens created after a certain date
   * @param {Date} createdAt date for comparison
   * @param {number} limit limit of requested tokens
   * @returns {Promise<WithId<Token>[]>} array of tokens
   */
  public async getCreatedAfter(createdAt: Date, limit: number): Promise<WithId<Token>[]> {
    const cursor = this.db.tokens()
      .find({
        createdAt: {
          $gt: createdAt,
        },
      })
      .limit(limit)
      .sort({ createdAt: MongoSort.ASC });

    return cursor.toArray();
  }

  /**
   * Get all tokens with prefix in id (ex belongs to contract)
   * @param {string} prefix id prefix of requested tokens
   * @returns {Promise<WithId<Token>[]>} array of tokens
   */
  public async getByIdPrefix(prefix: string): Promise<WithId<Token>[]> {
    const cursor = this.db.tokens().find({ _id: { $regex: `^${prefix}` } });

    return cursor.toArray();
  }

  public async getCountByIdPrefix(prefix: string): Promise<number> {
    const cursor = await this.db.tokens().count({ _id: { $regex: `^${prefix}` } });

    return cursor;
  }

  /**
   * Get all tokens created after a certain date
   * @param {Date} createdAt date for comparison
   * @param {string} id key for secondary sort when createdAt is the same
   * @param {number} limit limit of requested tokens
   * @returns {Promise<WithId<Token>[]>} array of tokens
   */
  public async getCreatedAfter2(createdAt: Date, id: string, limit: number): Promise<WithId<Token>[]> {
    const cursor = await this.db.tokens().aggregate<Token>([
      {
        $sort: { createdAt: MongoSort.ASC, _id: MongoSort.ASC },
      },
      {
        $match: { createdAt: { $gte: createdAt } },
      },
      {
        $match: {
          $or: [
            { createdAt: { $gt: createdAt } },
            {
              $and: [
                { createdAt: { $eq: createdAt } },
                { _id: { $gt: id } },
              ],
            },
          ],
        },
      },
      { $limit: limit },
    ]);

    return cursor.toArray();
  }

  public async listForBlockRange(end: number, id: string, block: number, limit: number): Promise<WithId<Token>[]> {
    const cursor = await this.db.tokens().aggregate<Token>([
      {
        $sort: { block: MongoSort.ASC, _id: MongoSort.ASC },
      },
      { $match: { block: { $gte: block } } },
      {
        $match: {
          $and: [
            {
              $or: [
                { block: { $gt: block } },
                { block: { $eq: block }, _id: { $gt: id } },
              ],
            },
            { block: { $lt: end } },
          ],
        },
      },
      { $limit: limit },
    ]);

    return cursor.toArray();
  }

  /**
   * Save token to the "tokens" collection
   * @param {TokenAttributes} tokenAttributes token
   * @returns {Promise<InsertOneResult>} result of saving
   */
  public async save(tokenAttributes: TokenAttributes): Promise<InsertOneResult> {
    return this.db.tokens().insertOne({
      _id: `${tokenAttributes.blockchain}:${tokenAttributes.contractAddress}:${tokenAttributes.tokenId}`,
      block: tokenAttributes.block,
      tokenUri: tokenAttributes.tokenUri,
      from: tokenAttributes.from,
      count: tokenAttributes.count,
      tokenMetadataStatus: TokenMetadataStatus.UNDEFINED,
      retryCount: 0,
      createdAt: tokenAttributes.createdAt,
    });
  }

  /**
   * Upsert token to the "tokens" collection
   * @param {TokenAttributes} tokenAttributes token
   * @returns {Promise<UpdateResult<Token>>} result of saving
   */
  public async upsert(tokenAttributes: TokenAttributes): Promise<UpdateResult> {
    const id = `${tokenAttributes.blockchain}:${tokenAttributes.contractAddress}:${tokenAttributes.tokenId}`;

    return this.db.tokens().updateOne({ _id: id }, {
      $setOnInsert: {
        block: tokenAttributes.block,
        tokenUri: tokenAttributes.tokenUri,
        count: tokenAttributes.count,
        from: tokenAttributes.from,
        retryCount: tokenAttributes.retryCount || 0,
        createdAt: tokenAttributes.createdAt,
        tokenMetadataStatus: TokenMetadataStatus.UNDEFINED,
      },
    }, { upsert: true });
  }

  /**
   * Update count of token
   * @param {string} id token id
   * @param {number} count count of token
   * @returns {Promise<UpdateResult>} result of updating
   */
  public async updateCount(id: string, count: number): Promise<UpdateResult> {
    return this.db.tokens().updateOne({ _id: id }, {
      $set: {
        count,
      },
    });
  }

  /**
   * Update the number of attempts of processing token
   * @param {string} id token id
   * @param {number} count count of token
   * @returns {Promise<UpdateResult>} result of updating
   */
  public async updateRetryCount(id: string): Promise<UpdateResult> {
    return this.db.tokens().updateOne({ _id: id }, { $inc: { retryCount: 1 } });
  }

  /**
   * Update availability status of token
   * @param {string} id token id
   * @param {boolean} isUnavailable is token unavailable
   * @returns {Promise<UpdateResult>} result of updating
   */
  public async updateUnavailability(id: string, tokenMetadataStatus: TokenMetadataStatus): Promise<UpdateResult> {
    return this.db.tokens().updateOne({ _id: id }, {
      $set: {
        tokenMetadataStatus,
      },
    });
  }

  /**
   * Get tokens in page representation
   * @param {number} pageNumber number of page
   * @param {number} limit limit of tokens per page
   * @returns {Promise<WithId<Token>[]>} token array
   */
  public async getPaged(pageNumber: number, limit: number): Promise<WithId<Token>[]> {
    const cursor = await this.db.tokens()
      .find({
      })
      .skip(pageNumber > 0 ? ( ( pageNumber - 1 ) * limit ) : 0)
      .limit(limit)
      .sort({ createdAt: MongoSort.ASC });

    return cursor.toArray();
  }
}

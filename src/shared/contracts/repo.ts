import { Inject, Injectable } from '@nestjs/common';
// TODO Replace deprecated DB provider to DBProvider
import { DB } from '@shared/db';
import { Collection, UpdateResult, WithId } from 'mongodb';
import { Blockchain } from '../blockchain';
import { MongoSort } from '../db';
import { TokenStandard } from '../tokens';

export type Contract = {
  _id: string;
  address: string;
  type: TokenStandard;
  name: string | null;
  block: number;
  createdAt: Date;
  updatedAt?: Date | null;
  collectionImage?: {
    url?: string;
    updatedAt?: Date;
  };
};

export type ContractAttributes = {
  blockchain: Blockchain;
  address: string;
  type: TokenStandard;
  name: string | null;
  block: number;
  createdAt: Date;
  collectionImage?: {
    url?: string;
    updatedAt?: Date;
  };
};

interface IDB {
  contracts(): Collection<Contract>;
}

/**
 * Contracts Repository (Injectable class)
 */
@Injectable()
export class ContractsRepo {
  constructor(
    // TODO Replace deprecated DB provider to DBProvider
    @Inject(DB) private readonly db: IDB,
  ) {}

  /**
   * Record contract if no duplicates
   * @param {ContractAttributes} attributes contract data
   * @returns {Promise<UpdateResult>} result of writing to DB
   */
  public insertIfNone(attributes: ContractAttributes): Promise<UpdateResult> {
    const id = `${attributes.blockchain}:${attributes.address}`;

    return this.db.contracts().updateOne({ _id: id }, {
      $setOnInsert: {
        address: attributes.address,
        type: attributes.type,
        name: attributes.name,
        block: attributes.block,
        createdAt: attributes.createdAt,
        collectionImage: attributes.collectionImage,
      },
    },
    {
      upsert: true,
    });
  }

  public insertOrUpdate(attributes: ContractAttributes): Promise<UpdateResult> {
    const id = `${attributes.blockchain}:${attributes.address}`;

    return this.db.contracts().updateOne({ _id: id }, {
      $set: {
        type: attributes.type,
        name: attributes.name,
        collectionImage: attributes.collectionImage,
      },
      $setOnInsert: {
        address: attributes.address,
        block: attributes.block,
        createdAt: attributes.createdAt,
      },
    },
    {
      upsert: true,
    });
  }

  /**
   * Recieve contracts list by array of identifiers
   *
   * @example
   * await getWhereIdIn(['eth:0x9FB2EEb757...a5dc404f', 'eth:0x9FB2EEb757...a5dc404f'])
   *
   * @param {string[]} ids array of contract identifiers
   * @returns {Promise<Contract[]>} array of contracts
   */
  public async getWhereIdIn(ids: string[]): Promise<Contract[]> {
    const cursor = this.db.contracts().find<Contract>({
      _id: { '$in': ids },
    });

    return cursor.toArray();
  }

  /**
   * Get contract by id
   * @param {string} id contract identifier
   * @returns {Promise<Contract | null>} contract
   */
  public get(id: string): Promise<Contract | null> {
    return this.db.contracts().findOne<Contract>({
      _id: { $regex: id, $options: 'i' },
    });
  }

  /**
   * Update contract name
   * @param {string} id contract identifier
   * @param {string} name new contract name
   * @returns {Promise<UpdateResult>} result of updating
   */
  public updateName(id: string, name: string): Promise<UpdateResult> {
    return this.db.contracts().updateOne({ _id: id }, {
      $set: {
        name,
        updatedAt: new Date(),
      },
    });
  }

  public updateCollectionImage(id: string, collectionImage: string) {
    return this.db.contracts().updateOne({ _id: id }, {
      $set: {
        collectionImage: {
          updatedAt: new Date(),
          url: collectionImage,
        },
        updatedAt: new Date(),
      },
    });
  }

  public update(id: string, attributes: Partial<ContractAttributes>) {
    return this.db.contracts().updateOne({ _id: id }, {
      $set: {
        ...attributes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get all contracts created after a certain date
   * @param {Date} createdAt date for comparison
   * @param {number} limit limit of requested contracts
   * @returns {Promise<WithId<Contract>[]>} array of contracts
   */
  public async getCreatedAfter(createdAt: Date, limit: number): Promise<WithId<Contract>[]> {
    const cursor = await this.db.contracts()
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
   * Recieve paginated contracts list
   *
   * @example
   * await getContractsList(0, 'eth:XXXXXX')
   *
   * @param {number} limit limit of contracts in result
   * @param {string} fromId from what contract start fetching
   * @returns {Promise<Contract[]>} array of contracts
   */
  public async getContractsList(limit: number, fromId?: string): Promise<Contract[]> {
    let where = {};

    if (fromId) {
      where = { _id: { $gt: fromId } };
    }

    const cursor = this.db.contracts().find<Contract>(where).sort({ _id: 1 }).limit(limit);

    return cursor.toArray();
  }
}

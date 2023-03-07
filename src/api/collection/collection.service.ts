import { Injectable } from '@nestjs/common';
import { Contract, ContractsRepo } from '@shared/contracts';

/**
 * Collection Service
 */
@Injectable()
export class CollectionService {
  constructor(private readonly contractsRepo: ContractsRepo) {}

  /**
   * Returns single collection from db by id
   * @param {string} collection id
   */
  public async get(id: string): Promise<Contract | null> {
    return this.contractsRepo.get(id);
  }
}

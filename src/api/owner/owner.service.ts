import { Blockchain } from '@shared/blockchain';
import { Injectable } from '@nestjs/common';

/**
 * Owner Service
 */
@Injectable()
export class OwnerService {

  /**
   * Get NFT owners from Explorers API
   * @param chainName
   * @param contractId
   * @param tokenId
   */
  //eslint-disable-next-line
  public getOwners(chainName: Blockchain, contractId: string, tokenId: string) {
    const mockDataFromExplorersAPI = [
      { address: '0xbbd472134464f87758a937d19d319dbb6e412386' },
      { address: '0x381e840f4ebe33d0153e9a312105554594a98c42' },
      { address: '0x118577a3be581f9cb65d658d5143e8cb0fede182' },
    ];

    return {
      owners: mockDataFromExplorersAPI,
    };
  }
}

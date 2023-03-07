import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';
import { IExplorersClientConfig } from '@shared/explorers-client/explorers-client.config';
import axios, { AxiosResponse } from 'axios';
import { ethers } from 'ethers';
import { Blockchain } from '@shared/blockchain';

/**
 * ExplorerEvent
 */
export interface ExplorerEvent extends ethers.providers.Log {
  signature: string;
  contract: string;
}

/**
 * ExplorersClient
 */
@Injectable()
export class ExplorersClient<T extends IBaseConfig> {

  private readonly apiUri?: string;

  /**
   * ExplorersClient constructor
   * @param {ConfigService}
   */
  constructor(
    private configService: ConfigService<T>,
  ) {
    const explorersClientConfig = this.configService.get<IExplorersClientConfig>('explorersClient') as IExplorersClientConfig;
    this.apiUri = explorersClientConfig.explorersApi;
  }

  /**
   * Makes request to Explorers API endpoint
   * @param {string}
   */
  public async request<T>(uri: string): Promise<T[]> {
    let paginationToken: string;
    let results: T[] = [];

    const { data: result }: AxiosResponse = await axios.get<string>(
      `${this.apiUri}/${uri}`,
    );

    results = results.concat(...result.data);
    paginationToken = result.token;

    while(paginationToken !== null) {
      const { data: result }: AxiosResponse = await axios.get<string>(
        `${this.apiUri}/${uri}?token=${paginationToken}`,
      );

      results = results.concat(...result.data);
      paginationToken = result.token;
    }

    return results;
  }

  /**
   * Fetches wallet events by event signature
   * @param {Blockchain}
   * @param {string}
   * @param {string}
   */
  public async fetchWalletEvents(chainName: Blockchain, walletAddress: string, eventSignature: string): Promise<ExplorerEvent[]> {
    return this.request<ExplorerEvent>(`${chainName}/address/${walletAddress}/events/${eventSignature}`);
  }
}

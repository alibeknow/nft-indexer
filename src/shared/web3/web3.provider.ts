import { ethers } from 'ethers';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';
import { IWeb3Config, getAuth, getNodeAddress } from '@shared/web3';

@Injectable()
export class Web3Provider<T extends IBaseConfig> {
  public provider: ethers.providers.JsonRpcProvider;

  constructor(private configService: ConfigService<T>) {
    const web3Config = this.configService.get<IWeb3Config>('web3') as IWeb3Config;
    const nodeAddress = getNodeAddress(web3Config);
    const { user, password } = getAuth(web3Config);

    let providerConnectionInfo: ethers.utils.ConnectionInfo = {
      url: nodeAddress,
    };

    if(user && password) {
      providerConnectionInfo = { ...providerConnectionInfo, user, password, allowInsecureAuthentication: true };
    }

    this.provider = new ethers.providers.StaticJsonRpcProvider(providerConnectionInfo);
  }
}

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { toChecksumAddress } from '@shared/address';
import { Blockchain } from '@shared/blockchain';
import { Contract, ContractsRepo } from '@shared/contracts';
import { logger } from '@shared/logger';
import {
  ContractEventData,
  MESSAGE_BUS_PROVIDER,
  ServiceEvents,
  TokenEventData,
} from '@shared/microservices';
import { Token, TokensRepo, toValidHex } from '@shared/tokens';
import { lastValueFrom } from 'rxjs';
import { RefreshContractParams, RefreshTokenParams } from './types';

@Injectable()
export class RefreshService implements OnApplicationShutdown {
  constructor(
    @Inject(MESSAGE_BUS_PROVIDER) private messageBusClient: ClientProxy,
    private readonly contractsRepo: ContractsRepo,
    private readonly tokensRepo: TokensRepo,
  ) {}

  private async _emitEvent(
    serviceEvent: ServiceEvents,
    eventData: ContractEventData | TokenEventData,
  ) {
    try {
      await lastValueFrom(this.messageBusClient.emit(serviceEvent, eventData));
    } catch (error) {
      logger.error({
        msg: 'Error sending message to queue with event',
        eventName: serviceEvent,
        payload: eventData,
      });

      throw new InternalServerErrorException(
        `Error sending ${serviceEvent} messsage to queue`,
      );
    }
  }

  private async _sendContract(contractEvent: ContractEventData) {
    await this._emitEvent(ServiceEvents.READ_CONTRACT, contractEvent);
  }

  private async _sendToken(tokenEvent: TokenEventData) {
    await this._emitEvent(ServiceEvents.READ_TOKEN, tokenEvent);
  }

  public async refreshContract(
    params: RefreshContractParams,
  ): Promise<Contract> {
    const { chainName, contractAddress } = params;

    const normalizedContractAddress = toChecksumAddress(contractAddress);
    const contract = await this.contractsRepo.get(
      `${chainName}:${normalizedContractAddress}`,
    );
    if (!contract) {
      throw new NotFoundException(
        `Contract address '${contractAddress}' not found`,
      );
    }

    const contractEvent: ContractEventData = {
      blockchainName: chainName,
      blockNumber: contract.block,
      contractAddress: contractAddress,
      contractType: contract.type,
    };

    await this._sendContract(contractEvent);

    const contractTokens = await this.tokensRepo.getByIdPrefix(
      `${chainName}:${normalizedContractAddress}`,
    );

    const sendTokensResult = await Promise.all(
      contractTokens.map(async (token: Token) => {
        try {
          const [ chainName, contractAddress, tokenId ] = token._id.split(':');

          const tokenEvent: TokenEventData = {
            blockchainName: chainName as Blockchain,
            blockNumber: token.block,
            contractAddress: contractAddress,
            contractType: contract.type,
            tokenId,
          };

          await this._sendToken(tokenEvent);

          return {
            id: token._id,
            result: true,
          };
        } catch (error) {
          return {
            id: token._id,
            result: false,
          };
        }
      }),
    );
    const failedTokensList = sendTokensResult
      .filter((item) => item.result === false)
      .map((item) => item.id);
    if (failedTokensList.length) {
      throw new InternalServerErrorException(
        'Error sending some tokens to queue',
      );
    }

    await this._sendContract(contractEvent);

    return contract;
  }

  public async refreshToken(params: RefreshTokenParams): Promise<Token> {
    const { chainName, contractAddress, tokenId } = params;

    const normalizedContractAddress = `${chainName}:${toChecksumAddress(
      contractAddress,
    )}`;
    const contract = await this.contractsRepo.get(normalizedContractAddress);
    if (!contract) {
      throw new NotFoundException(
        `Contract '${chainName}:${contractAddress}' not found`,
      );
    }

    const tokeHex = toValidHex(tokenId);
    const token = await this.tokensRepo.getById(
      `${normalizedContractAddress}:${tokeHex}`,
    );
    if (!token) {
      throw new NotFoundException(
        `Token '${contractAddress}:${tokeHex}' not found`,
      );
    }

    if (!token.tokenUri) {
      throw new NotFoundException('Couldn\'t fetch the tokenURI');
    }

    const tokenEvent: TokenEventData = {
      blockchainName: chainName,
      blockNumber: token.block,
      contractAddress: contractAddress,
      contractType: contract.type,
      tokenId,
    };

    await this._sendToken(tokenEvent);

    return token;
  }

  async onApplicationShutdown() {
    await this.messageBusClient.close();
  }
}

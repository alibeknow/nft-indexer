import { TokenAttributes, TokenStandard } from '@shared/tokens';
import { ethers } from 'ethers';
import { CONTRACT_OBJECTS } from '@shared/pre-721';
import { TransferEvent } from './events';
import { logger } from '@shared/index';
import { IServiceConfig } from '../app.config';

const abi = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [ { name: '', type: 'string' } ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [ { internalType: 'uint256', name: 'tokenId', type: 'uint256' } ],
    name: 'tokenURI',
    outputs: [ { internalType: 'string', name: '', type: 'string' } ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [ { name: '_id', type: 'uint256' } ],
    name: 'uri',
    outputs: [ { name: '', type: 'string' } ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [ { name: '_tokenId', type: 'uint256' } ],
    name: 'tokenMetadata',
    outputs: [ { name: 'infoUrl', type: 'string' } ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export async function getContractName(
  provider: ethers.providers.BaseProvider,
  address: string,
): Promise<string|undefined> {
  const contractObject = CONTRACT_OBJECTS.find((element) => element.address === address);

  let name = contractObject?.name;
  const contract = new ethers.Contract(address, abi, provider);

  try {
    if (!name) {
      name = await contract.name();
    }
  } catch (err) {
    logger.error({
      msg: 'Error fetching contract name',
      contract: address,
      error: err,
    });
  }

  return name;
}

export async function getTokens(
  provider: ethers.providers.BaseProvider,
  event: TransferEvent,
  serviceConfig: IServiceConfig,
): Promise<TokenAttributes[]> {
  const contractFeature = CONTRACT_OBJECTS.find((element) => element.address === event.contractAddress)?.features;

  const tokens: TokenAttributes[] = [];

  const contractAddress = event.contractAddress;
  const api = contractFeature?.api;
  const tokenMetadata = contractFeature?.tokenMetadata;

  const block = event.blockNumber;

  const contract = new ethers.Contract(contractAddress, abi, provider);

  for (const tokenId of event.ids) {
    const tokenAttributes = {
      blockchain: serviceConfig.chainName,
      contractAddress,
      tokenId,
      block,
      from: '',
      tokenUri: '',
      count: 1,
      createdAt: new Date(),
    };

    try {
      if (api) {
        tokenAttributes.tokenUri = api + BigInt(tokenId).toString();
      } else if (tokenMetadata) {
        tokenAttributes.tokenUri = await contract.tokenMetadata(tokenId);
      } else {
        switch (event.type) {
        case TokenStandard.ERC721:
        case TokenStandard.PRE721:
          tokenAttributes.tokenUri = await contract.tokenURI(tokenId);
          break;
        case TokenStandard.ERC1155:
        case TokenStandard.PRE1151:
          tokenAttributes.tokenUri = await contract.uri(tokenId);
          break;
        }
      }

      tokens.push(tokenAttributes);
    } catch (err) {
      logger.error({
        msg: 'Error getting token URI',
        contract: contractAddress,
        token: tokenId,
        block,
        error: err,
      });
    }
  }

  return tokens;
}

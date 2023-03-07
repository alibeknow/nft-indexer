import { Command } from 'commander';
import dotenv from 'dotenv';
import { logger } from '@shared/logger';
import { MetadataEventData, ServiceEvents, TokenEventData, clientFactory } from '@shared/microservices';
import { ConfigService } from '@nestjs/config';
import { TokenStandard, TokensRepo } from '@shared/tokens';
import { MetadataRepoDB, UriProtocol } from '@shared/metadata';
import { lastValueFrom } from 'rxjs';
import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { DBClass, getDatabaseConfig } from '@shared/db';
import { Blockchain } from '@shared/blockchain';
import { Contract, ContractsRepo } from '@shared/contracts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import IPFSGatewayTools from '@pinata/ipfs-gateway-tools/dist/node';
import * as fs from 'fs';

const app = new Command();
app
  .name('Tokens reader')
  .version('0.0.1');

app.command('fill-metadata-queue')
  .description('Read all tokens from tokens DB and send events to metadata reader rabbitmq queue')
  .option('--id <string>', 'starting token id', String, '')
  .option('--created-at <string>', 'starting token creation tim date string', undefined)
  .option('--batch-limit <number>', 'db batch limit', Number, 1000)
  .option('--missing-metadata <boolean>', 'process tokens with no metadata only', (value) => value === 'true', false)
  .action(fillMetadataQueue);

app.command('fill-contract-queue')
  .description('Read all tokens with empty URI from tokens DB and send events to contract reader rabbitmq queue')
  .option('--id <string>', 'starting token id', String, '')
  .option('--created-at <string>', 'starting token creation tim date string', undefined)
  .option('--batch-limit <number>', 'db batch limit', Number, 1000)
  .action(fillContractQueue);

app.command('count-token-uris')
  .description('Read all tokens from tokens DB and send events to metadata reader rabbitmq queue')
  .option('--id <string>', 'starting token id', String, '')
  .option('--batch-limit <number>', 'db batch limit', Number, 1000)
  .requiredOption('--start <number>', 'start block', Number)
  .requiredOption('--end <number>', 'last block(not inclusive)', Number)
  .option('--missing-metadata <boolean>', 'process tokens with no metadata only', (value) => value === 'true', false)
  .action(countTokenURIsForBlockRange);

dotenv.config();
app.parse();

interface Input {
  id: string;
  createdAt: string;
  batchLimit: number;
  missingMetadata: boolean;
}

interface CountURIsInput {
  id: string;
  batchLimit: number;
  start: number;
  end: number;
  missingMetadata: boolean;
}

async function fillMetadataQueue(input: Input) {
  const baseConfig = getBaseConfig();
  const dbConfig = getDatabaseConfig();
  const configService = new ConfigService<IBaseConfig>(baseConfig);

  const db = new DBClass(dbConfig);
  await db.open();
  const clientProxy = clientFactory(configService, 'metadataQueue');

  const tokensRepo = new TokensRepo(db);
  const metadataRepo = new MetadataRepoDB(db);

  let createdAt = input.createdAt ? new Date(input.createdAt) : new Date(0);
  let id = input.id;

  for (;;) {
    console.time(`fetchTokens ${id}`);
    let tokens = await tokensRepo.getCreatedAfter2(createdAt, id, input.batchLimit);
    console.timeEnd(`fetchTokens ${id}`);
    if (tokens.length === 0) {
      break;
    }

    const tokensLength = tokens.length;
    const block = tokens[tokensLength - 1].block;
    const created = tokens[tokensLength - 1].createdAt;
    const tokenId = tokens[tokensLength - 1]._id;

    createdAt = tokens[tokens.length - 1].createdAt;
    id = tokens[tokens.length - 1]._id;

    if (input.missingMetadata) {
      const foundMetadata = await metadataRepo.getIdsWhereIdIn(tokens.map<string>(token => token._id));
      tokens = tokens.filter(token => !foundMetadata.some(found => token._id === found._id));
    }

    logger.info({ msg: 'Fetched new tokens',
      fetched: tokensLength,
      id: tokenId,
      createdAt: created,
      block: block,
      toProcess: tokens.length,
    });

    for (const token of tokens) {
      if (!token.tokenUri) {
        continue;
      }

      const [ blockchain, contract, tokenId ] = token._id.split(':');

      const data: MetadataEventData = {
        blockchainName: blockchain as Blockchain,
        blockNumber: token.block,
        contractAddress: contract,
        contractType: TokenStandard.ERC721,
        tokenId: tokenId,
        tokenUri: token.tokenUri,
      };

      try {
        const obs = clientProxy.emit(ServiceEvents.READ_METADATA, data);
        await lastValueFrom(obs);
      } catch (e) {
        logger.error({
          error: e,
          payload: data,
        });
      }
    }
  }

  logger.info({ msg: 'Finished processing tokens' });
}


async function fillContractQueue(input: Input) {
  const baseConfig = getBaseConfig();
  const dbConfig = getDatabaseConfig();
  const configService = new ConfigService<IBaseConfig>(baseConfig);

  const db = new DBClass(dbConfig);
  await db.open();
  const clientProxy = clientFactory(configService, 'contractsQueue');

  const tokensRepo = new TokensRepo(db);
  const contractsRepo = new ContractsRepo(db);

  let createdAt = input.createdAt ? new Date(input.createdAt) : new Date(0);
  let id = input.id;

  for (;;) {
    console.time(`fetchTokens ${id}`);
    const tokens = await tokensRepo.getCreatedAfter2(createdAt, id, input.batchLimit);
    console.timeEnd(`fetchTokens ${id}`);
    if (tokens.length === 0) {
      break;
    }

    const tokensLength = tokens.length;
    const block = tokens[tokensLength - 1].block;

    createdAt = tokens[tokens.length - 1].createdAt;
    id = tokens[tokens.length - 1]._id;

    logger.info({ msg: 'Fetched new tokens',
      fetched: tokensLength,
      id,
      createdAt,
      block,
    });

    let toProcess = 0;
    const contractsCache = new Map<string, Contract>();

    for (const token of tokens) {
      if(token.tokenUri && token.tokenUri !== '') {
        continue;
      }
      toProcess++;

      const [ blockchain, contractAddress, tokenId ] = token._id.split(':');

      let contract: Contract;
      if (contractsCache.has(`${blockchain}:${contractAddress}`)) {
        contract = contractsCache.get(`${blockchain}:${contractAddress}`)!;
      } else {
        const dbContract = await contractsRepo.get(`${blockchain}:${contractAddress}`);
        if (!dbContract) {
          throw new Error(`contract ${contractAddress} not found`);
        }

        contract = dbContract;
        contractsCache.set(`${blockchain}:${contractAddress}`, dbContract);
      }

      const data: TokenEventData = {
        blockchainName: blockchain as Blockchain,
        blockNumber: token.block,
        contractAddress: contractAddress,
        contractType: contract.type,
        tokenId,
      };

      try {
        const obs = clientProxy.emit(ServiceEvents.READ_TOKEN, data);
        await lastValueFrom(obs);
      } catch (e) {
        logger.error({
          error: e,
          payload: data,
        });
      }
    }
    logger.info({ msg: 'Tokens processed',
      toProcess,
    });
  }

  logger.info({ msg: 'Finished processing tokens' });
}

async function countTokenURIsForBlockRange(input: CountURIsInput) {
  const dbConfig = getDatabaseConfig();

  const db = new DBClass(dbConfig);
  await db.open();

  const tokensRepo = new TokensRepo(db);
  const metadataRepo = new MetadataRepoDB(db);

  let id = input.id;
  let block = input.start;

  let nonEmptyCount = 0;
  let httpCount = 0;
  let ipfsCount = 0;
  let ipfsBrokenCount = 0;
  let ipfsIOCount = 0;
  let ipfsPinataCount = 0;
  let ipfsGatewayCount = 0;
  let onChainCount = 0;

  for (;;) {
    console.time(`fetchTokens ${id}`);
    let tokens = await tokensRepo.listForBlockRange(input.end, id, block, input.batchLimit);
    console.timeEnd(`fetchTokens ${id}`);
    if (tokens.length === 0) {
      break;
    }

    const tokensLength = tokens.length;
    const created = tokens[tokensLength - 1].createdAt;

    id = tokens[tokensLength - 1]._id;
    block = tokens[tokensLength - 1].block;

    if (input.missingMetadata) {
      const foundMetadata = await metadataRepo.getIdsWhereIdIn(tokens.map<string>(token => token._id));
      tokens = tokens.filter(token => !foundMetadata.some(found => token._id === found._id));
    }

    logger.info({ msg: 'Fetched new tokens',
      fetched: tokensLength,
      id,
      createdAt: created,
      block,
    });

    let encoded = '';
    let tokensWithEmptyURI = 0;

    for (const token of tokens) {
      if (!token.tokenUri) {
        tokensWithEmptyURI++;
        continue;
      }

      const gatewayTools = new IPFSGatewayTools();
      let containsCID = false;

      nonEmptyCount++;

      let uriType = '';

      const protocol = token.tokenUri.split(':')[0];
      switch (protocol) {
      case UriProtocol.IPFS:
        ipfsCount++;
        uriType = 'ipfs';
        break;
      case UriProtocol.DATA:
        onChainCount++;
        uriType = 'data';
        break;
      case UriProtocol.HTTP:
      case UriProtocol.HTTPS:
        httpCount++;
        uriType = 'http';

        containsCID = gatewayTools.containsCID(token.tokenUri).containsCid;
        if (containsCID) {
          const uri = token.tokenUri.split('://')[1];
          if (!uri) {
            ipfsBrokenCount++;
            uriType = 'gateway/broken';
          } else if (uri.startsWith('ipfs.io')) {
            ipfsIOCount++;
            uriType = 'gateway/io';
          } else if (uri.startsWith('gateway.pinata.cloud')) {
            ipfsPinataCount++;
            uriType = 'gateway/pinata';
          } else {
            ipfsGatewayCount++;
            uriType = 'gateway';
          }
        }
      }

      let uri = token.tokenUri;
      if (protocol === UriProtocol.DATA) {
        uri = '';
      }
      encoded += `${JSON.stringify({ id: token._id, block: token.block, uriType, uri })  }\n`;
    }

    if (encoded !== '') {
      fs.appendFile(`./tokens/tokens-uris-br-${input.start}-${input.end}.txt`, encoded, function(err) {
        if (err) console.log(err);
      });
    }
    logger.info({ msg: 'Finished processing tokens batch',
      tokensWithEmptyURI,
      nonEmptyCount,
      httpCount,
      ipfsCount,
      ipfsBrokenCount,
      ipfsIOCount,
      ipfsPinataCount,
      ipfsGatewayCount,
      onChainCount,
    });
  }

  logger.info({ msg: 'Finished processing tokens' });
}

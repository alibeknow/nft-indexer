import { ConfigService } from '@nestjs/config';
import dotenv from 'dotenv';
import * as ethers from 'ethers';
import tokenAbi from './token-abi.json';
import dataAbi from './data-abi.json';
import { DBClass, IDatabaseConfig } from '@shared/db';
import { closeDb } from '@shared/close';
import { logger } from '@shared/logger';
import { TokenStandard } from '@shared/tokens/token-standard';
import { Web3Provider } from '@shared/web3';
import { IBaseConfig } from '@shared/baseconfig';
import { Blockchain } from '@shared/blockchain';
import { TokenAttributes, TokensRepo } from '@shared/tokens/repo';
import { ContractsRepo } from '@shared/contracts';
import { DATA_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from './constants';

dotenv.config();

const tokenContractAbi = JSON.stringify(tokenAbi);
const dataContractAbi = JSON.stringify(dataAbi);

export async function processCryptoPunks(baseConfig: IBaseConfig) {
  const dbConfig: IDatabaseConfig = baseConfig.database;
  const db = new DBClass(dbConfig);

  const config = new ConfigService<IBaseConfig>(baseConfig);
  const web3Provider = new Web3Provider<IBaseConfig>(config);
  const provider = web3Provider.provider;

  const cryptoPunksTokens = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenContractAbi, provider);
  const cryptoPunksData = new ethers.Contract(DATA_CONTRACT_ADDRESS, dataContractAbi, provider);

  const contractRepo = new ContractsRepo(db);
  const tokenRepo = new TokensRepo(db);

  const totalSupply = await cryptoPunksTokens.totalSupply();

  const contract = {
    blockchain: Blockchain.ETH,
    address: TOKEN_CONTRACT_ADDRESS,
    type: TokenStandard.CRYPTOPUNKS,
    name: 'CryptoPunks',
    block: 0,
    createdAt: new Date(),
  };

  await db.open();
  logger.info({ msg: 'DB connection is opened' });

  try {
    await contractRepo.insertIfNone(contract);
  } catch (err) {
    logger.error({ msg: 'Error storing contract into DB', error: err });
  }

  let data: TokenAttributes;
  let id = '';
  let metadata = '';

  logger.info({ msg: 'Started processing CryptoPunks data 🚀' });

  for (let i = 0; i < totalSupply; i++) {
    id = `eth:${TOKEN_CONTRACT_ADDRESS}:${i}`;

    try {
      metadata = await cryptoPunksData.punkImageSvg(i);
    } catch (err) {
      logger.error({ msg: 'Error getting punk image svg', error: err });
    }

    data = {
      blockchain: Blockchain.ETH,
      contractAddress: TOKEN_CONTRACT_ADDRESS,
      tokenId: id,
      block: 0,
      from: '',
      tokenUri: metadata,
      count: 1,
      createdAt: new Date(),
    };

    try {
      await tokenRepo.save(data);
    } catch (err) {
      logger.error({ msg: 'Error storing token into DB', error: err });
    }
  }

  await closeDb(db);
  logger.info({ msg: 'Processing is finished' });
  logger.info({ msg: 'DB connection is closed' });
}

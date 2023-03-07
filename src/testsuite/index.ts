import * as dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';
import { TokensRepo } from '@shared/tokens';
import { Command } from 'commander';
import { closeDb } from '@shared/close';
import { isEqual } from 'lodash';
import { WaitGroup } from '@shared/wg';

const program = new Command();
program.command('rarible-comparison').action(indexerRaribleCompare)
  .option('--rarible-url <string>', 'Rarible URL', String, 'https://api.rarible.org')
  .option('--indexer-url <string>', 'Indexer URL', String, 'http://localhost:8090')
  .option('--limit <number>', 'Limit', Number, 1000)
  .option('--workers <number>', 'Workers', Number, 1);
program.parse();

interface InputParams {
  raribleUrl: string;
  indexerUrl: string;
  limit: number;
  workers: number;
}

async function indexerRaribleCompare(input: InputParams) {
  const dbConfig: IDatabaseConfig = getDatabaseConfig();
  const db = new DBClass(dbConfig);
  await db.open();

  const tokenRepo = new TokensRepo(db);
  const wg = new WaitGroup(input.workers);

  for (let i = 1; ;i++) {
    const result = await tokenRepo.getPaged(i, input.limit);
    if (result.length === 0) {
      break;
    }

    for (const item of result) {
      let raribleResponse: any;
      let indexerResponse: any;
      let isFailedIndex = false;
      let isFailedRarible = false;
      const fullId = item._id;
      const ethContract = fullId.split(':')[1];
      const ethToken = fullId.split(':').pop();
      const raribleType = `ETHEREUM:${ethContract}:${ethToken}`;

      await wg.go(async () => {
        try {
          indexerResponse = await request(input.indexerUrl)
            .get(`/api/v0/eth/metadata/${ethContract}/${ethToken}`)
            .set('Accept', 'application/json');
          if (indexerResponse.statusCode !== 200) {
            isFailedIndex = true;
            console.error(`Failed fetching ${ethContract}:${ethToken} metadata from indexer API: ${indexerResponse.statusCode}`);
          }
        } catch (e) {
          isFailedIndex = true;
          console.error(`Error fetching ${ethContract}:${ethToken} metadata from indexer API: ${e}`);
        }
        try {
          raribleResponse = await request(input.raribleUrl)
            .get(`/v0.1/items/${raribleType}`)
            .set('Accept', 'application/json');
          if (raribleResponse.statusCode !== 200) {
            isFailedRarible = true;
            console.error(`Failed fetching ${raribleType} metadata from rarible API: ${raribleResponse.statusCode}`);
          }
        } catch (e) {
          isFailedRarible = true;
          console.error(`Error fetching ${raribleType} metadata from rarible API: ${e}`);
        }

        const hasIndexerAPI = !isFailedIndex;
        const hasRaribleAPI = !isFailedRarible;

        if (isFailedIndex || isFailedRarible) {
          console.log(`Block:${item.block}, tokenID:${ethToken}, contractID:${ethContract}, 
          hasIndexerAPI:${hasIndexerAPI}, hasRaribleAPI:${hasRaribleAPI}, isDifferent:null`);

          return;
        }

        const meta = indexerResponse.body.result;
        const raribleMeta = raribleResponse.body.meta;

        // Content is skipped for transformed objects as rarible transforms IPFS URIs to infura gateway URIs.
        // The least can be done is to compare content length to see if all the media were added to content.
        const transformed = {
          name: meta?.name,
          description: meta?.description,
          attributes: meta?.attributes?.map((prop: Record<string, unknown>) => ({
            key: prop.trait_type, value: prop.value,
          })),
          contentLength: meta?.content?.length,
        };
        const transformedRarible = {
          name: raribleMeta?.name,
          description: raribleMeta?.description,
          attributes: raribleMeta?.attributes,
          contentLength: raribleMeta?.content.length,
        };

        if (isEqual(transformed, transformedRarible)) {
          console.log(`Block:${item.block}, tokenID:${ethToken}, contractID:${ethContract}, 
          hasIndexerAPI:${hasIndexerAPI}, hasRaribleAPI:${hasRaribleAPI}, isDifferent:false`);
        } else {
          console.log(`Block:${item.block}, tokenID:${ethToken}, contractID:${ethContract}, 
          hasIndexerAPI:${hasIndexerAPI}, hasRaribleAPI:${hasRaribleAPI}, isDifferent:true`);
        }
      });
    }
  }
  await wg.wait();
  await closeDb(db);
}

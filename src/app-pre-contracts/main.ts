import client from 'prom-client';
import { ConfigService } from '@nestjs/config';
import { Web3Provider } from '@shared/web3';
import { IPreContractsConfig, IServiceConfig, getPreContractsConfig } from './app.config';
import { getContractName, getEthNodeTransferEvents, getTokens } from './ethnode';
import { ethers } from 'ethers';
import { EventsRepo } from '@shared/events';
import { DBClass, getDatabaseConfig } from '@shared/db';
import { ContractsRepo } from '@shared/contracts';
import { TokensRepo } from '@shared/tokens';
import { logger, registry } from '@shared/index';
import { MetadataEventData, ServiceEvents, clientFactory } from '@shared/microservices';
import { lastValueFrom } from 'rxjs';
import express from 'express';

process.on('uncaughtException', (error) => {
  logger.error({
    name: error.name,
    msg: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

client.collectDefaultMetrics({
  prefix: 'x_node_',
  register: registry,
});

const updatePreEventCounter = new client.Counter({
  name: 'update_pre_event_counter',
  help: 'update pre event counter',
  registers: [ registry ],
});

const updatePreContractCounter = new client.Counter({
  name: 'update_pre_contract_counter',
  help: 'update pre contract counter',
  registers: [ registry ],
});

const updatePreTokenCounter = new client.Counter({
  name: 'update_pre_token_counter',
  help: 'update pre token counter',
  registers: [ registry ],
});

const appConfig = new ConfigService<IPreContractsConfig>(getPreContractsConfig());
const serviceConfig = appConfig.get<IServiceConfig>('service') as IServiceConfig;

const db = new DBClass(getDatabaseConfig());
db.open();

const eventsRepo = new EventsRepo(db);
const contractsRepo = new ContractsRepo(db);
const tokensRepo = new TokensRepo(db);
const messageBusClient = clientFactory(appConfig, 'metadataQueue');

const web3Provider = new Web3Provider(appConfig);

async function bootstrap() {
  const app = express();
  app.get('/metrics', async (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  app.listen(serviceConfig.port, () => {
    logger.info(`Server is running on http://localhost:${serviceConfig.port}, metrics are exposed on http://localhost:${serviceConfig.port}/metrics`);
  });

  const contracts = new Map<string, never>();

  const { blockNumberFrom, blockNumberTo } = serviceConfig;

  let to;
  let from = to = blockNumberFrom;

  for (; to <= blockNumberTo;) {

    to = to + serviceConfig.limit;

    if (to > blockNumberTo) {
      to = blockNumberTo;
    }

    const events = await getEthNodeTransferEvents(from, to, web3Provider.provider as ethers.providers.Web3Provider);
    logger.info({
      msg: `Found ${events.length} new unchecked events`,
      blockNumberFrom: from,
      blockNumberTo: to,
    });

    updatePreEventCounter.inc(events.length);

    try {
      if (events.length > 0) {
        await eventsRepo.bulkSaveOrUpdate(events);
      }
    } catch (error) {
      logger.error({
        msg: 'Error updating/writing in events collection',
        blockNumberFrom: from,
        blockNumberTo: to,
      });
    }

    for (const event of events) {
      if (!contracts.has(event.contractAddress)) {
        contracts.set(event.contractAddress, {} as never);

        const name = await getContractName(web3Provider.provider, event.contractAddress) as string;

        try {
          await contractsRepo.insertOrUpdate({
            blockchain: serviceConfig.chainName,
            address: event.contractAddress,
            type: event.type,
            block: event.blockNumber,
            createdAt: new Date(),
            name,
          });

          logger.info({
            msg: 'New contract was detected',
            contractAddress: event.contractAddress,
          });

          updatePreContractCounter.inc(1);
        } catch(error) {
          logger.error({
            msg: 'Error updating/writing in contracts collection',
            contractAddress: event.contractAddress,
            error: error,
          });
        }
      }

      const tokens = await getTokens(web3Provider.provider, event, serviceConfig);

      for (const token of tokens) {
        try {
          const result = await tokensRepo.upsert(token);
          const emit = result.upsertedCount === 1 || result.modifiedCount === 1;

          if (emit) {
            const metadataEvent: MetadataEventData = {
              blockchainName: serviceConfig.chainName,
              blockNumber: token.block,
              contractAddress: token.contractAddress,
              contractType: event.type,
              tokenId: token.tokenId,
              tokenUri: token.tokenUri,
            };

            updatePreTokenCounter.inc(1);
            try {
              await lastValueFrom(messageBusClient.emit(ServiceEvents.READ_METADATA, metadataEvent));
            } catch (error) {
              logger.error({
                msg: 'Error sending message to queue with event',
                eventName: ServiceEvents.READ_METADATA,
                eventData: metadataEvent,
              });
            }
          }
        } catch (error) {
          logger.error({
            msg: 'Error updating/writing in tokens collection',
            contractAddress: event.contractAddress,
            error: error,
          });
        }
      }
    }

    if(to >= blockNumberTo) {
      break;
    }

    from = to;
  }
}

bootstrap();

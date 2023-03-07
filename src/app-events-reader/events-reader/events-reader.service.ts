import client from 'prom-client';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { registry } from '@shared/index';
import { logger } from '@shared/logger';
import { BlockQueue, BlocksQueueRepo } from '@shared/blocks-queue';
import { EventsRepo } from '@shared/events';
import { getBlock, getEthNodeTransferEvents } from '@shared/ethnode';
import { ethers } from 'ethers';
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGE_BUS_PROVIDER, ServiceEvents } from '@shared/microservices';
import { Web3Provider } from '@shared/web3';
import { IEventsReaderConfig, IServiceConfig } from '../app.config';

const totalBlocksGauge = new client.Gauge({
  name: 'total_blocks_gauge',
  help: 'total blocks gauge',
  registers: [ registry ],
});

const eventsCounterGauge = new client.Gauge({
  name: 'events_counter_gauge',
  help: 'events counter gauge',
  registers: [ registry ],
});

const eventsGauge = new client.Gauge({
  name: 'events_gauge',
  help: 'events gauge',
  registers: [ registry ],
});

const fetchEventsGauge = new client.Gauge({
  name: 'fetch_events_gauge',
  help: 'fetch events gauge',
  registers: [ registry ],
});

const saveEventsGauge = new client.Gauge({
  name: 'save_events_gauge',
  help: 'save events gauge',
  registers: [ registry ],
});

const totalGauge = new client.Gauge({
  name: 'total_events_gauge',
  help: 'total (fetch + save) gauge',
  registers: [ registry ],
});

export type EventsReaderParams = {
  blockNumberFrom: number;
  blockNumberTo: number;
};

/**
 * Events Reader Service
 * Service used by events reader app module and responsible for read events data from blocks
 */
@Injectable()
export class EventsReaderService implements OnApplicationShutdown {
  private pre721ContractsEnabled: boolean;

  constructor(
    @Inject(MESSAGE_BUS_PROVIDER) private messageBusClient: ClientProxy,
    private readonly web3Provider: Web3Provider<IEventsReaderConfig>,
    private readonly events: EventsRepo,
    private readonly blockQueue: BlocksQueueRepo,
    private readonly configService: ConfigService<IEventsReaderConfig>,
  ) {
    const serviceConfig = this.configService.get<IServiceConfig>('service') as IServiceConfig;

    this.pre721ContractsEnabled = serviceConfig.pre721ContractsEnabled;
  }

  /**
   * Asynchronously read events data from blocks and save events to collection events.
   * Save blocks queue range from passed block numbers to collection blockQueue.
   * @param {EventsReaderParams} blockNumberFrom, blockNumberTo - blocks range
   * @param {ethers.providers.BaseProvider} provider custom provider
   */
  public async read(
    { blockNumberFrom, blockNumberTo }: EventsReaderParams,
    chainReorgHandling: boolean,
    emitReread = false,
  ): Promise<void> {

    const totalEnd = totalGauge.startTimer();

    const fetchEventsEnd = fetchEventsGauge.startTimer();
    const events = await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, this.pre721ContractsEnabled, this.web3Provider.provider);

    fetchEventsEnd();

    eventsGauge.set(events.length);
    eventsCounterGauge.inc(events.length);

    const saveEventsEnd = saveEventsGauge.startTimer();
    if(events.length > 0) {
      const operation = emitReread ? 'bulkUpsert' : 'bulkSave';
      await this.events[operation](events);
    }
    saveEventsEnd();

    logger.info({
      msg: `Saved ${events.length} events in DB...`,
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    let fromBlockData: ethers.providers.Block | null = null;
    let latestFromDB: BlockQueue | null = null;

    if(chainReorgHandling) {
      const isTheSameBlockRange = blockNumberFrom === blockNumberTo;

      const results = await Promise.all([
        getBlock(this.web3Provider.provider, blockNumberFrom),
        isTheSameBlockRange ? Promise.resolve() : getBlock(this.web3Provider.provider, blockNumberTo),
        this.blockQueue.getLatest(blockNumberFrom),
      ]);

      fromBlockData = results[0];
      const toBlockData = isTheSameBlockRange ? results[0] : results[1];
      latestFromDB = results[2];

      await this.blockQueue.save({
        from: blockNumberFrom,
        to: blockNumberTo,
        toHash: toBlockData?.hash,
      });
    } else {
      await this.blockQueue.save({
        from: blockNumberFrom,
        to: blockNumberTo,
      });
    }

    totalBlocksGauge.inc(blockNumberTo - blockNumberFrom + 1); // Because we process blocks inclusively

    logger.info({
      msg: `Saved blocks queue range ${blockNumberFrom}-${blockNumberTo} in DB...`,
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    this.messageBusClient.emit(ServiceEvents.INDEX_BLOCK_RANGE, {
      reread: emitReread ? true : false,
      blockFrom: blockNumberFrom,
      blockTo: blockNumberTo,
    });

    if(fromBlockData && latestFromDB && fromBlockData.parentHash !== latestFromDB.toHash) {
      await this.reread({ blockNumberFrom: latestFromDB.from, blockNumberTo: latestFromDB.to });
    }

    totalEnd();
  }

  public async reread({ blockNumberFrom, blockNumberTo }: EventsReaderParams): Promise<void> {
    logger.info(`Re-read block range ${blockNumberFrom}-${blockNumberTo} due to blockchain reorg...`);

    const { deletedCount } = await this.events.deleteByBlockRange(blockNumberFrom, blockNumberTo);
    eventsCounterGauge.dec(deletedCount);
    logger.info(`Deleted ${deletedCount} events for block range ${blockNumberFrom}-${blockNumberTo} from DB`);

    await this.blockQueue.softDelete(blockNumberFrom, blockNumberTo);
    totalBlocksGauge.dec(blockNumberTo - blockNumberFrom + 1);
    logger.info(`Soft deleted block range ${blockNumberFrom}-${blockNumberTo} from DB`);

    await this.read({ blockNumberFrom, blockNumberTo }, true, true);
  }

  async onApplicationShutdown() {
    await this.messageBusClient.close();
  }
}

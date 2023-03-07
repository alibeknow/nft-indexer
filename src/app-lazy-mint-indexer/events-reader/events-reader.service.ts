import { logger } from '@shared/logger';
import { EventsReaderParams } from '@app-events-reader/events-reader';
import { Injectable } from '@nestjs/common';
import { EventsRepo } from '@shared/events';
import { LazyMintBlocksQueueRepo } from '@shared/lazy-mint-blocks-queue';
import { Web3Provider } from '@shared/web3';
import { getEthNodeTransferEvents } from '@shared/ethnode';
import { WithId } from 'mongodb';
import { Event } from '@shared/events';
import { ILazyMintIndexerConfig } from '../app.config';

@Injectable()
export class EventsReaderService {

  constructor(
    private readonly web3Provider: Web3Provider<ILazyMintIndexerConfig>,
    private readonly events: EventsRepo,
    private readonly lazyMintBlocksQueue: LazyMintBlocksQueueRepo,
  ) {}

  public async read({ blockNumberFrom, blockNumberTo }: EventsReaderParams): Promise<WithId<Event>[]> {
    const events = await getEthNodeTransferEvents(blockNumberFrom, blockNumberTo, false, this.web3Provider.provider);
    const eventsFromDb = await this.events.getByBlockRange(blockNumberFrom, blockNumberTo);
    const eventsFromDbIds = eventsFromDb.map((event) => event._id);

    const eventsDifference = events.filter((event) => {
      const { blockNumber, transactionHash, logIndex } = event;
      const id = `${blockNumber}:${transactionHash}:${logIndex}`;

      return !eventsFromDbIds.includes(id);
    });

    let results: WithId<Event>[] = [];

    logger.info({
      msg: `Found ${eventsDifference.length} new lazy mint events...`,
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    if(eventsDifference.length > 0) {
      await this.events.bulkSave(eventsDifference);

      const ids = eventsDifference.map(({ blockNumber, transactionHash, logIndex }) =>
        `${blockNumber}:${transactionHash}:${logIndex}`,
      );

      results = await this.events.getWhereIdIn(ids);
    }

    logger.info({
      msg: `Saved ${eventsDifference.length} events in DB...`,
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    await this.lazyMintBlocksQueue.save({
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    logger.info({
      msg: `Saved blocks queue range ${blockNumberFrom}-${blockNumberTo} in DB...`,
      from: blockNumberFrom,
      to: blockNumberTo,
    });

    return results;
  }
}

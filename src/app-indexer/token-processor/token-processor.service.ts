import { logger } from '@shared/logger';
import { EventsRepo } from '@shared/events';
import client from 'prom-client';
import { Injectable } from '@nestjs/common';
import { registry } from '@shared/metrics';
import { TokenProcessorProvider } from './token-processor.provider';

const processedBlocksGauge = new client.Gauge({
  name: 'processed_block_gauge',
  help: 'processed block gauge',
  registers: [ registry ],
});
const fetchEventsGauge = new client.Gauge({
  name: 'fetch_events_gauge',
  help: 'fetch events gauge',
  registers: [ registry ],
});
const eventsGauge = new client.Gauge({
  name: 'events_gauge',
  help: 'events gauge',
  registers: [ registry ],
});

/**
 * Token Processor Service (Injectable class)
 */
@Injectable()
export class TokenProcessorService {
  constructor(
    private readonly events: EventsRepo,
    private readonly tokenProcessorProvider: TokenProcessorProvider,
  ) {}

  /**
   * Asynchronously start block range processing
   *
   * @example <caption>Process block range from 14 to 18</caption>
   * await tokenProcessorService.processBlockRange(14, 18)
   *
   * @param {number} blockFrom first block from range
   * @param {number} blockTo last block from range
   */
  async processBlockRange(blockFrom: number, blockTo: number): Promise<void> {
    const end = processedBlocksGauge.startTimer();

    logger.info({ from: blockFrom, to: blockTo, msg: 'Started processing events for block range' });

    const fetchEventsGaugeEnd = fetchEventsGauge.startTimer();
    const events = await this.events.getByBlockRange(blockFrom, blockTo);
    fetchEventsGaugeEnd();

    eventsGauge.set(events.length);

    logger.info({ from: blockFrom, to: blockTo, msg: `Events count ${events.length} for block range` });

    await this.tokenProcessorProvider.process(blockFrom, blockTo, events);
    end();
  }
}

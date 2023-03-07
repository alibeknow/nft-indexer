import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CommunicationTransport, IMicroservicesConfig, ServiceEvents } from '@shared/microservices';
import { TokenProcessorService } from './token-processor.service';
import { IndexerDto } from './token-processor.dtos';
import { logger } from '@shared/logger';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';

/**
 * Token Processor Controller
 */
@Controller()
export class TokenProcessorController {
  private readonly microservicesConfig: IMicroservicesConfig;

  constructor(
    private readonly tokenProcessorService: TokenProcessorService,
    private readonly configService: ConfigService<IBaseConfig>,
  ) {
    this.microservicesConfig = configService.get<IMicroservicesConfig>('microservices') as IMicroservicesConfig;
  }

  /**
   * Read block range from queue on INDEX_BLOCK_RANGE event
   */
  @EventPattern(ServiceEvents.INDEX_BLOCK_RANGE)
  async eventHandler(@Ctx() context: RmqContext, @Payload() eventData: IndexerDto) {
    logger.debug({ msg: 'Received message', eventData: eventData });
    await this.tokenProcessorService.processBlockRange(eventData.blockFrom, eventData.blockTo);

    if(this.microservicesConfig.transport === CommunicationTransport.RMQ) {
      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    }
  }
}

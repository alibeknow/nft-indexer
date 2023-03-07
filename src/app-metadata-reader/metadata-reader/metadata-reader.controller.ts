import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CommunicationTransport, IMicroservicesConfig, ServiceEvents } from '@shared/microservices';
import { Controller } from '@nestjs/common';
import { logger } from '@shared/logger';
import { MetadataReaderService } from './metadata-reader.service';
import { ReadMetadataMsgDto } from './metadata-reader.dto';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';

/**
 * Metadata Reader Controller
 */
@Controller()
export class MetadataReaderController {
  private readonly microservicesConfig: IMicroservicesConfig;

  constructor(
    private readonly metadataReaderService: MetadataReaderService,
    private readonly configService: ConfigService<IBaseConfig>,
  ) {
    this.microservicesConfig = this.configService.get<IMicroservicesConfig>('microservices') as IMicroservicesConfig;
  }

  /**
   * Read metadata from queue on READ_METADATA event
   */
  @EventPattern(ServiceEvents.READ_METADATA)
  async readMetadata(
    @Ctx() context: RmqContext,
    @Payload() eventData: ReadMetadataMsgDto,
  ): Promise<void> {
    logger.debug({ msg: 'Received message', eventData: eventData });
    await this.metadataReaderService.readOne(eventData);

    if(this.microservicesConfig.transport === CommunicationTransport.RMQ) {
      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    }
  }
}

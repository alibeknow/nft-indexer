import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CommunicationTransport, IMicroservicesConfig, ServiceEvents } from '@shared/microservices';
import { Controller } from '@nestjs/common';
import { logger } from '@shared/logger';
import { ContractReaderService } from './contract-reader.service';
import { ReadContractMsgDto, ReadTokenMsgDto } from './contract-reader.dto';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';

/**
* Contract Reader Controller
* Controller updates contract name or token uri depending on the event and communication transport: sqs | rmq
*/
@Controller()
export class ContractReaderController {
  private readonly microservicesConfig: IMicroservicesConfig;

  constructor(
    private readonly contractReaderService: ContractReaderService,
    private readonly configService: ConfigService<IBaseConfig>,
  ) {
    this.microservicesConfig = configService.get<IMicroservicesConfig>('microservices') as IMicroservicesConfig;
  }

  /**
  * Read contract message from queue on READ_CONTRACT event and updates contract name
  */
  @EventPattern(ServiceEvents.READ_CONTRACT)
  async readContract(
    @Ctx() context: RmqContext,
    @Payload() eventData: ReadContractMsgDto,
  ): Promise<void> {
    logger.debug({ msg: 'Received message', eventData: eventData });
    await this.contractReaderService.processContract(eventData);

    if(this.microservicesConfig.transport === CommunicationTransport.RMQ) {
      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    }
  }

  /**
  * Read token message from queue on READ_TOKEN event and update token uri
  */
  @EventPattern(ServiceEvents.READ_TOKEN)
  async readToken(
    @Ctx() context: RmqContext,
    @Payload() eventData: ReadTokenMsgDto,
  ): Promise<void> {
    logger.debug({ msg: 'Received message', eventData: eventData });
    await this.contractReaderService.processToken(eventData);

    if(this.microservicesConfig.transport === CommunicationTransport.RMQ) {
      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    }
  }
}

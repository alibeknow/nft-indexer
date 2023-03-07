import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import {
  CommunicationTransport,
  IMicroservicesConfig,
  IRabbitConfig,
  ISqsConfig,
  QueueType,
  SQSClient,
  getRabbitUrl,
} from '@shared/microservices';
import { IBaseConfig } from '@shared/baseconfig';

export const clientFactory = (configService: ConfigService<IBaseConfig>, queueType: QueueType) => {
  const microservicesConfig = configService.get<IMicroservicesConfig>('microservices') as IMicroservicesConfig;

  if (microservicesConfig.transport === CommunicationTransport.SQS) {
    const sqsConfig = configService.get<ISqsConfig>('sqs') as ISqsConfig;

    return ClientProxyFactory.create({
      customClass: SQSClient,
      options: {
        sqsUrl: sqsConfig[queueType],
        perSendMessageUniqIdOptions: {
          MessageDeduplicationId: !!sqsConfig.messageDeduplication,
          MessageGroupId: !!sqsConfig.messageGrouping,
        },
      },
    });
  } else {
    const rabbitConfig = configService.get<IRabbitConfig>('rabbit') as IRabbitConfig;

    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [ getRabbitUrl(rabbitConfig) ],
        queue: rabbitConfig[queueType],
        queueOptions: {
          durable: false,
        },
      },
    });
  }
};

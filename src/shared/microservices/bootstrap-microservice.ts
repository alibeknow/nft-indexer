import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  CommunicationTransport,
  IMicroservicesConfig,
  IRabbitConfig,
  ISqsConfig,
  QueueType,
  SQSTransport,
  getRabbitUrl,
} from '@shared/microservices';
import { IBaseConfig } from '@shared/baseconfig';

const SQS_BLOCKS_QUEUE = 'blocksQueue';

export async function bootstrapMicroservice(
  app: INestApplication,
  queueType: QueueType,
): Promise<void> {
  const configService = app.get<ConfigService<IBaseConfig>>(ConfigService<IBaseConfig>);
  const microservicesConfig = configService.get<IMicroservicesConfig>('microservices') as IMicroservicesConfig;

  if(microservicesConfig.transport === CommunicationTransport.SQS) {
    const sqsConfig = configService.get<ISqsConfig>('sqs') as ISqsConfig;

    app.connectMicroservice({
      strategy: new SQSTransport({
        sqsUrl: sqsConfig[queueType],
        batchSize: queueType === SQS_BLOCKS_QUEUE ? 1 : 10,
        workersCount: sqsConfig.queueWorkersCount,
      }),
    });
  } else {
    const rabbitConfig = configService.get<IRabbitConfig>('rabbit') as IRabbitConfig;

    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [ getRabbitUrl(rabbitConfig) ],
        queue: rabbitConfig[queueType],
        queueOptions: {
          durable: false,
        },
        noAck: false,
        prefetchCount: 1,
      },
    });
  }

  await app.startAllMicroservices();
}

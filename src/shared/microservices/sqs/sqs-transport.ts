import { CustomTransportStrategy, IncomingRequest, Server } from '@nestjs/microservices';
import { SQSTransportOptions } from './sqs-transport-options.interface';
import { SQSContext } from './sqs-context';
import { SQSConsumer, SQSMessage } from './sqs-consumer';
import { logger } from '@shared/index';

export class SQSTransport extends Server implements CustomTransportStrategy {
  private consumer: SQSConsumer;

  constructor(options: SQSTransportOptions) {
    super();

    const { sqsUrl, ...restOptions } = options;

    this.consumer = SQSConsumer.create({
      queueUrl: sqsUrl,
      ...restOptions,
      handleMessageBatch: this.handleMessageBatch.bind(this),
    });
  }

  public listen(callback: () => void) {
    this.consumer.start();
    callback();
  }

  public async handleMessageBatch(messages: SQSMessage[]): Promise<void> {
    await Promise.all(messages.map(async (message: SQSMessage) => {
      const { pattern, data, id } = JSON.parse(message.Body || '') as IncomingRequest;
      const handler = this.getHandlerByPattern(pattern);

      if (handler) {
        const sqsCtx = new SQSContext([ pattern as string, id as string ]);
        await handler(data, sqsCtx);
      } else {
        logger.info(`No handler for pattern ${pattern}`);
      }
    }));
  }

  public close() {
    this.consumer.stop();
  }
}

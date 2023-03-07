import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  ClientProxy,
  ReadPacket,
  WritePacket,
} from '@nestjs/microservices';
import { logger } from '@shared/index';
import { SQSClientOptions } from './sqs-client-options.interface';

export class SQSClient extends ClientProxy {
  protected sqsClient: AWS.SQS | null = null;

  constructor(protected readonly options: SQSClientOptions) {
    super();
  }

  // eslint-disable-next-line
  protected publish(partialPacket: ReadPacket, callback: (packet: WritePacket) => any): any {
    throw new Error('Not implemented');
  }

  protected dispatchEvent(packet: ReadPacket): Promise<any> {
    if (!this.sqsClient) {
      throw new Error('AWS SQS is not initialized');
    }
    const pattern = this.normalizePattern(packet.pattern);
    const data = packet.data;
    const id = uuidv4();

    const options: Partial<AWS.SQS.SendMessageRequest> = {};

    if (this.options.perSendMessageUniqIdOptions?.MessageDeduplicationId) {
      options.MessageDeduplicationId = uuidv4();
    }
    if (this.options.perSendMessageUniqIdOptions?.MessageGroupId) {
      options.MessageGroupId = uuidv4();
    }

    const params = {
      MessageAttributes: { 'id': { 'DataType': 'String', 'StringValue': id } },
      MessageBody: JSON.stringify({
        data,
        id,
        pattern,
      }),
      QueueUrl: `${this.options.sqsUrl}`,
      ...options,
    };

    return this.sqsClient.sendMessage(params)
      .promise()
      .catch(err => logger.error({
        msg: (err as Error).message,
        error: err,
      }));
  }

  public async connect(): Promise<AWS.SQS> {
    if (this.sqsClient) {
      return this.sqsClient;
    }

    this.sqsClient = new AWS.SQS({
      region: this.options.region,
    });

    return this.sqsClient;
  }

  public close() {
    this.sqsClient = null;
  }
}

import { AWSError } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import client from 'prom-client';
import { WaitGroup } from '@shared/wg';
import { logger, registry } from '@shared/index';
import { v4 as uuidv4 } from 'uuid';

const sqsConsumerGauge = new client.Gauge({
  name: 'sqs_consumer_gauge',
  help: 'sqs consumer gauge',
  registers: [ registry ],
});

type ReceieveMessageResponse = PromiseResult<AWS.SQS.Types.ReceiveMessageResult, AWSError>;
export type SQSMessage = AWS.SQS.Types.Message;

function assertOptions(options: SQSConsumerOptions): void {
  if (!options.queueUrl) {
    throw new Error('Missing SQS consumer option queueUrl.');
  }

  if (!options.handleMessageBatch) {
    throw new Error('Missing SQS consumer option handleMessageBatch.');
  }

  if (options.batchSize && (options.batchSize > 10 || options.batchSize < 1)) {
    throw new Error('SQS batchSize option must be between 1 and 10.');
  }
}
function hasMessages(response: ReceieveMessageResponse): boolean {
  return response.Messages && response.Messages.length > 0 || false;
}

export interface SQSConsumerOptions {
  queueUrl: string;
  batchSize?: number;
  waitTimeSeconds?: number;
  region?: string;
  workersCount?: number;
  pollTimeout?: number;
  handleMessageBatch(messages: SQSMessage[]): Promise<void>;
}

export class SQSConsumer {
  private queueUrl: string;
  private handleMessageBatch: (message: SQSMessage[]) => Promise<void>;
  private batchSize: number;
  private waitTimeSeconds: number;
  private sqs: AWS.SQS;
  private workersCount: number;
  private wg: WaitGroup;
  private isRunning: boolean;
  private pollTimeout: number;
  private pollTimersMap: Map<string, number>;

  constructor(options: SQSConsumerOptions) {
    assertOptions(options);
    this.isRunning = false;
    this.queueUrl = options.queueUrl;
    this.handleMessageBatch = options.handleMessageBatch;
    this.batchSize = options.batchSize || 1;
    this.waitTimeSeconds = options.waitTimeSeconds || 20;
    this.workersCount = options.workersCount || 1;
    this.pollTimeout = options.pollTimeout || 0;
    this.wg = WaitGroup.withGauge(this.workersCount, sqsConsumerGauge);
    this.pollTimersMap = new Map();

    this.sqs = new AWS.SQS({
      region: options.region || process.env.AWS_REGION || 'eu-west-1',
    });
    this.poll = this.poll.bind(this);
  }

  public static create(options: SQSConsumerOptions): SQSConsumer {
    return new SQSConsumer(options);
  }

  public start(): void {
    this.isRunning = true;
    this.poll();
  }

  public stop(): void {
    this.isRunning = false;

    this.pollTimersMap.forEach((pollTimerId) => clearTimeout(pollTimerId));
    this.pollTimersMap.clear();
  }

  private async handleSqsResponse(response: ReceieveMessageResponse): Promise<void>{
    if (response) {
      if (hasMessages(response)) {
        // @ts-ignore
        await this.processMessageBatch(response.Messages);
      }
    }
  }

  private async poll(timerUuid?: string): Promise<void> {
    const receiveParams = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: this.batchSize,
      WaitTimeSeconds: this.waitTimeSeconds,
    };

    if (timerUuid && this.pollTimersMap.has(timerUuid)) {
      this.pollTimersMap.delete(timerUuid);
    }

    if (!this.isRunning) {
      return;
    }

    this.wg.go(async () => {
      try {
        const timerUuid = uuidv4();
        const pollTimerId = setTimeout(this.poll, this.pollTimeout, [ timerUuid ]);
        this.pollTimersMap.set(timerUuid, pollTimerId);
        const response = await this.sqs.receiveMessage(receiveParams).promise();
        await this.handleSqsResponse(response);
      } catch(err: unknown) {
        logger.error({
          msg: `Error polling: ${(err as Error).message}`,
          error: err,
        });
      }
    });
  }

  private async processMessageBatch(messages: SQSMessage[]): Promise<void> {
    await this.executeBatchHandler(messages)
      .then(() => {
        return this.deleteMessageBatch(messages);
      })
      .catch((err: Error) => {
        logger.error({
          msg: `Error polling: ${err.message}`,
          error: err,
        });
      });
  }

  private async deleteMessageBatch(messages: SQSMessage[]): Promise<AWS.SQS.Types.DeleteMessageBatchResult> {
    const deleteParams: AWS.SQS.Types.DeleteMessageBatchRequest = {
      QueueUrl: this.queueUrl,
      // @ts-ignore
      Entries: messages.map((message: SQSMessage) => ({
        Id: message.MessageId,
        ReceiptHandle: message.ReceiptHandle,
      })),
    };

    return this.sqs.deleteMessageBatch(deleteParams)
      .promise()
      .catch((err: Error) => {
        throw new Error(`SQS delete message failed: ${err.message}`);
      });
  }

  private async executeBatchHandler(messages: SQSMessage[]): Promise<void> {
    try {
      await this.handleMessageBatch(messages);
    } catch (err: unknown) {
      throw new Error(`Unexpected message handler failure: ${(err as Error).message}`);
    }
  }
}

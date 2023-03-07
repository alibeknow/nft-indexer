import { Command } from 'commander';
import { logger } from '@shared/logger';
import { sendMessageToQueue } from './producer.service';
import { QueueType, ServiceEvents } from '@shared/microservices';

const program = new Command();
program
  .name('Queue-sender')
  .version('0.0.1');

program
  .command('queue-sender')
  .description('NFT Events sender')
  .requiredOption('--queue-name <string>', 'queue name')
  .requiredOption('--event-type <string>', 'event type')
  .requiredOption('--payload <string>', 'queue payload')
  .action(sendPayload);

program.parse();

export type InputParams = {
  queueName: QueueType;
  eventType: ServiceEvents;
  payload: string;
};

async function sendPayload(inputs: InputParams): Promise<void> {
  logger.info(`Started sending payload to queue name ${inputs.queueName}`);
  logger.info(inputs.payload, 'payload of message');

  return await sendMessageToQueue(inputs);
}

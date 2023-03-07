import { IBaseConfig, getBaseConfig } from '@shared/baseconfig';
import { InputParams } from './index';
import { lastValueFrom } from 'rxjs';
import { logger } from '@shared/logger';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { clientFactory } from '@shared/microservices';

export async function sendMessageToQueue(inputs: InputParams): Promise<void> {
  const config = new ConfigService<IBaseConfig>(getBaseConfig());
  const client: ClientProxy = clientFactory(config, inputs.queueName);

  await client.connect();

  const lastValue = await lastValueFrom(client.emit(inputs.eventType, inputs.payload));
  logger.info(lastValue);

  await client.close();
}

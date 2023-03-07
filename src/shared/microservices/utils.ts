import { ConfigService } from '@nestjs/config';

export function getRabbitUrlDeprecated(configService: ConfigService): string {
  const protocol = configService.get<string>('RABBIT_PROTOCOL') ?? 'amqp';
  const username = configService.get<string>('RABBIT_USERNAME');
  const password = configService.get<string>('RABBIT_PASSWORD');
  const host = configService.get<string>('RABBIT_HOST');
  const port = configService.get<string>('RABBIT_PORT');

  if (username && password) {
    return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `${protocol}://${host}:${port}`;
}

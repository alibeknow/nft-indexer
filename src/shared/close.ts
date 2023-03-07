import { Server } from 'http';
import { DBClass } from './db';
import { logger } from './logger';

export async function closeDb(db: DBClass): Promise<void> {
  await db.close(true);

  logger.info('DB is closed');
}

export async function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      logger.info('Server is closed');
      resolve();
    });
  });
}

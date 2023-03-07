import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { ResponseInterceptor } from '@shared/response';

/**
 * Configures API middleware functions
 * @param {NestExpressApplication} NestExpressApplication instance
 */
export const configureAppMiddleware = (app: NestExpressApplication): void => {
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.set('trust proxy', 1);
  app.enableCors();

  app.use(helmet());
  app.use(compression());

  app.useGlobalInterceptors(new ResponseInterceptor());
};

import { NestExpressApplication } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { configureAppMiddleware } from '@shared/api';

export const getNestApp = async (moduleRef: TestingModule): Promise<INestApplication> => {
  const app: INestApplication = moduleRef.createNestApplication();

  configureAppMiddleware(app as NestExpressApplication);
  await app.init();

  return app;
};

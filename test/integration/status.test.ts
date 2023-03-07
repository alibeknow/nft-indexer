process.env.APP_VERSION = '0.0.1';

import { HttpServer, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { LoggerModule } from 'nestjs-pino';
import { getBaseConfig } from '@shared/baseconfig';
import { getNestApp } from '../helpers/app';
import { StatusController } from '@shared/status';

jest.setTimeout(50000);

describe('[Status endpoint]', () => {
  let app: INestApplication;
  let httpServer: HttpServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(),
        ConfigModule.forRoot({
          load: [ getBaseConfig ],
          isGlobal: true,
        }),
      ],
      controllers: [ StatusController ],
    }).compile();

    app = await getNestApp(moduleRef);
    httpServer = app.getHttpServer();
  });

  describe('[GET /_health]', () => {
    it('should return OK and status code 200', async () => {
      const actualResult = await request(httpServer).get('/_health').set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });
  });

  describe('[GET /_version]', () => {
    it('should return version and status code 200', async () => {
      const actualResult = await request(httpServer).get('/_version').set('Accept', 'application/json');

      expect(actualResult.statusCode).toBe(200);
      expect(actualResult.body).toMatchSnapshot();
    });
  });
});

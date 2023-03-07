import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Configures Swagger OpenAPI v3 docs
 * @param {NestExpressApplication} NestExpressApplication instance
 */
export const configureAppDocs = (app: NestExpressApplication, title: string): void => {
  const options = new DocumentBuilder()
    .setTitle(title)
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger-api', app, document);

  app.useStaticAssets(join(__dirname, '../docs/typedoc'), { prefix: '/wiki' });
};

import { Injectable } from '@nestjs/common';
import { DBClass, IDatabaseConfig, getDatabaseConfig } from '@shared/db';

@Injectable()
export class DB extends DBClass {
  constructor() {
    const databaseConfig: IDatabaseConfig = getDatabaseConfig();

    super(databaseConfig);
  }
}

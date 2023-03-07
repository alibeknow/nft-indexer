import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseConfig } from '@shared/baseconfig';
import { DBClass, IDatabaseConfig } from '@shared/db';

@Injectable()
export class DBProvider<T extends IBaseConfig> extends DBClass {

  constructor(private readonly configService: ConfigService<T>) {
    super(configService.get<IDatabaseConfig>('database') as IDatabaseConfig);
  }
}

import { Module, OnModuleDestroy } from '@nestjs/common';
import { OpensearchProvider } from './opensearch.provider';
import { IBaseConfig } from '../baseconfig';

@Module({
  providers: [ OpensearchProvider ],
  exports: [ OpensearchProvider ],
  imports: [],
})
export class OpensearchModule implements OnModuleDestroy {
  constructor(
    private readonly opensearchProvider: OpensearchProvider<IBaseConfig>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.opensearchProvider.close();
  }
}

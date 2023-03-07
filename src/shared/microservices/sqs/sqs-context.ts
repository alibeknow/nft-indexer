import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';

type SQSContextArgs = string[];

export class SQSContext extends BaseRpcContext<SQSContextArgs> {
  constructor(args: SQSContextArgs) {
    super(args);
  }

  getPattern() {
    return this.args[0];
  }

  getMessageId() {
    return this.args[1];
  }
}

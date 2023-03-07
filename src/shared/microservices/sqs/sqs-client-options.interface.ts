export interface SQSUniqueOptions {
  MessageDeduplicationId?: boolean;
  MessageGroupId?: boolean;
}

export interface SQSClientOptions {
  sqsUrl: string;
  region?: string;
  perSendMessageUniqIdOptions?: SQSUniqueOptions;
}

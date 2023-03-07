export interface SQSTransportOptions {
  sqsUrl: string;
  region?: string;
  waitTimeSeconds?: number;
  batchSize?: number;
  workersCount?: number;
}

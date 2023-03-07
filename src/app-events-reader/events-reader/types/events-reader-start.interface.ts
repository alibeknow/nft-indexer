import { EventIndexType } from '@shared/events';

export interface IEventsReaderStart {
  blockNumberFrom?: number;
  blockNumberTo?: number;
  type?: EventIndexType;
}

import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EventIndexType, EventsReaderStateLog, EventsReaderStateLogRepo } from '@shared/events';
import { IEventsReaderStart, IEventsReaderStateLogId } from './types';

@Injectable()
export class ReaderTasksProvider {
  private _taskAbortController: AbortController | undefined;

  constructor(
    private readonly eventsReaderStateLog: EventsReaderStateLogRepo,
  ) {
    this._resetAbortController();
  }

  public get abortController() {
    return this._taskAbortController;
  }

  private _resetAbortController() {
    if(this._taskAbortController){
      delete this._taskAbortController;
    }

    this._taskAbortController = new AbortController();
  }

  public async startReaderTask(attributes: IEventsReaderStart): Promise<IEventsReaderStateLogId> {
    const currentLog = await this.eventsReaderStateLog.getCurrentLog();

    if (currentLog?.inProgress) {
      throw new ConflictException(`Indexing is already in progress: id ${currentLog._id}. Stop existing process`);
    }

    this._resetAbortController();

    const result = await this.eventsReaderStateLog.insertOrUpdate({
      blockNumberFrom: attributes.blockNumberFrom || null,
      blockNumberTo: attributes.blockNumberTo || null,
      type: attributes.type || EventIndexType.NEW_ONLY,
    });

    return {
      id: result,
    };
  }

  public async stopReaderTask(): Promise<IEventsReaderStateLogId> {
    this._taskAbortController?.abort();

    const currentLog = await this.eventsReaderStateLog.getCurrentLog();

    if (!currentLog?.inProgress) {
      throw new BadRequestException('There is no currently running index process');
    }

    const result = await this.eventsReaderStateLog.insertOrUpdate({
      id: currentLog._id,
      inProgress: false,
      endAt: new Date(),
    });

    return {
      id: result,
    };
  }

  public async getActiveReaderTask(): Promise<EventsReaderStateLog | null> {
    const currentLog = await this.eventsReaderStateLog.getCurrentLog();

    if (!currentLog || !currentLog?.inProgress) {
      return null;
    }

    return currentLog;
  }

  public async getReaderState(): Promise<IEventsReaderStateLogId> {
    const currentLog = await this.eventsReaderStateLog.getCurrentLog();

    if (!currentLog) {
      throw new BadRequestException('There is no currently running index process');
    }

    return {
      inProgress: currentLog?.inProgress ?? false,
    };
  }
}

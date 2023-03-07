import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCodeDescription } from '@shared/response';
import { BadRequestException, ConflictException, InternalServerException } from '@shared/response-exception';

import { ReaderTasksProvider } from './reader-tasks.provider';
import { EventsReaderStartRequestDto, EventsReaderStateLogIdDto } from './dto';
/**
 * Events Reader Controller
 */
@ApiTags('Events Reader')
@Controller('/')
export class EventsReaderController {

  constructor(
    private readonly readerTasksProvider: ReaderTasksProvider,
  ) {}

  @Post('/reader-start')
  @ApiExtraModels(EventsReaderStartRequestDto)
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: EventsReaderStateLogIdDto })
  @ApiConflictResponse({ description: HttpStatusCodeDescription.CONFLICT, type: ConflictException })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiOperation({ summary: 'Start events reader indexing' })
  public async startReader(@Body() startAttributes: EventsReaderStartRequestDto): Promise<EventsReaderStateLogIdDto>{

    const results = await this.readerTasksProvider.startReaderTask(startAttributes);

    return results;
  }

  @Post('/reader-stop')
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: EventsReaderStateLogIdDto })
  @ApiBadRequestResponse({ description: HttpStatusCodeDescription.BAD_REQUEST, type: BadRequestException })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiOperation({ summary: 'Stop events reader indexing' })
  public async stopReader(): Promise<EventsReaderStateLogIdDto>{

    const results = await this.readerTasksProvider.stopReaderTask();

    return results;
  }

  @Get('/reader-state')
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: EventsReaderStateLogIdDto })
  @ApiBadRequestResponse({ description: HttpStatusCodeDescription.BAD_REQUEST, type: BadRequestException })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiOperation({ summary: 'Stop events reader indexing' })
  public async stateReader(): Promise<EventsReaderStateLogIdDto>{

    const results = await this.readerTasksProvider.getReaderState();

    return results;
  }
}

import { HttpStatusCodeDescription } from '@shared/response';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IAppConfig, IBaseConfig } from '@shared/baseconfig';

@ApiTags('Status')
@Controller()
export class StatusController {
  private appConfig: IAppConfig;

  constructor(private configService: ConfigService<IBaseConfig>) {
    this.appConfig = this.configService.get<IAppConfig>('app') as IAppConfig;
  }

  @Get('_health')
  @ApiOperation({ summary: 'Check API Health status' })
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR })
  healthStatus(): string {
    return 'OK';
  }

  @Get('_version')
  @ApiOperation({ summary: 'Get application version' })
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR })
  getVersion(): string {
    return this.appConfig.version || '';
  }
}

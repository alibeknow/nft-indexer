import { Response as ExpressResponse } from 'express';
import { Controller, Get, Response } from '@nestjs/common';
import { registry } from '@shared/metrics';

@Controller('/metrics')
export class MetricsController {

  @Get('/')
  public async getMetrics(
    @Response() res: ExpressResponse,
  ) {
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  }
}

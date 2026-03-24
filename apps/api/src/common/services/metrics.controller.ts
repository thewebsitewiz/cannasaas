import { Controller, Get, Res } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';
import { Response } from 'express';

@Controller()
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  @Public()
  @Get('metrics')
  getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(this.metrics.serialize());
  }
}

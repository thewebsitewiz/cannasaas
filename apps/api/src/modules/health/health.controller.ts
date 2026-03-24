import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { StatusService } from './status.service';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @Public()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('status')
  @Public()
  async status() {
    return this.statusService.getStatus();
  }
}

@Controller({ path: 'status', version: VERSION_NEUTRAL })
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @Public()
  async getStatus() {
    return this.statusService.getStatus();
  }
}

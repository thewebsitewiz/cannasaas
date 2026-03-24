import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

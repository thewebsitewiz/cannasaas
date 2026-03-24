import { Controller, Get, Post, Body, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ChangelogService } from './changelog.service';

@Controller({ path: 'changelog', version: VERSION_NEUTRAL })
export class ChangelogController {
  constructor(private readonly changelog: ChangelogService) {}

  @Get()
  @Public()
  async getChangelog(@Query('limit') limit?: string) {
    return this.changelog.getChangelog(limit ? parseInt(limit, 10) : 50);
  }

  @Get('latest')
  @Public()
  async getLatestVersion() {
    const version = await this.changelog.getLatestVersion();
    return { version };
  }

  @Post()
  @Roles('super_admin')
  async createEntry(
    @Body() body: { version: string; title: string; description: string; category?: string },
  ) {
    return this.changelog.createEntry(body.version, body.title, body.description, body.category);
  }
}

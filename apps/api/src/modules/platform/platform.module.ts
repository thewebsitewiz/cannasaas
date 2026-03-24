import { Module } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformResolver } from './platform.resolver';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';

@Module({
  controllers: [ChangelogController],
  providers: [PlatformService, PlatformResolver, ChangelogService],
  exports: [PlatformService, ChangelogService],
})
export class PlatformModule {}

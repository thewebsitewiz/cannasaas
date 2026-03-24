import { Module } from '@nestjs/common';
import { ThemeConfig } from './theme-config.entity';
import { ThemeService } from './theme.service';
import { ThemeResolver } from './theme.resolver';

@Module({
  providers: [ThemeService, ThemeResolver],
  exports: [ThemeService],
})
export class ThemeModule {}

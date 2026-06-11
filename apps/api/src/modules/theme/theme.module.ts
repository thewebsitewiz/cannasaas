import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeConfig } from './theme-config.entity';
import { ThemeService } from './theme.service';
import { ThemeResolver } from './theme.resolver';
import { ThemeCssService } from './theme-css.service';
import { ThemeCssController } from './theme-css.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeConfig])],
  controllers: [ThemeCssController],
  providers: [ThemeService, ThemeResolver, ThemeCssService],
  exports: [ThemeService, ThemeCssService],
})
export class ThemeModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeConfig } from './theme-config.entity';
import { ThemeService } from './theme.service';
import { ThemeResolver } from './theme.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeConfig])],
  providers: [ThemeService, ThemeResolver],
  exports: [ThemeService],
})
export class ThemeModule {}

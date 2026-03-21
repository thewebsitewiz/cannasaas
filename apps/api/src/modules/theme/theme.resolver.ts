import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ThemeService } from './theme.service';
import { ThemeConfigType, SaveThemeConfigInput } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@Resolver(() => ThemeConfigType)
export class ThemeResolver {
  constructor(private readonly themeService: ThemeService) {}

  @Public()
  @Query(() => ThemeConfigType, { name: 'themeConfig' })
  async getThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<ThemeConfigType> {
    return this.themeService.getByDispensaryId(dispensaryId);
  }

  @Mutation(() => ThemeConfigType, { name: 'saveThemeConfig' })
  async saveThemeConfig(
    @Args('input') input: SaveThemeConfigInput,
  ): Promise<ThemeConfigType> {
    return this.themeService.save(input);
  }

  @Mutation(() => ThemeConfigType, { name: 'resetThemeConfig' })
  async resetThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<ThemeConfigType> {
    return this.themeService.resetToDefault(dispensaryId);
  }
}

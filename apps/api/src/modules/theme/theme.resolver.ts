import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ThemeService } from './theme.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType() class ThemeOption {
  @Field(() => Int) themeId!: number;
  @Field() code!: string;
  @Field() name!: string;
  @Field({ nullable: true }) description?: string;
}

@ObjectType() class DispensaryTheme {
  @Field({ name: 'themeCode' }) theme_code!: string;
  @Field({ name: 'customCss', nullable: true }) custom_css?: string;
  @Field({ name: 'logoUrl', nullable: true }) logo_url?: string;
  @Field({ name: 'brandName', nullable: true }) brand_name?: string;
}

@Resolver()
export class ThemeResolver {
  constructor(private readonly themes: ThemeService) {}

  @Query(() => [ThemeOption], { name: 'themes' })
  async listThemes(): Promise<any[]> { return this.themes.getThemes(); }

  @Query(() => DispensaryTheme, { name: 'dispensaryTheme' })
  async dispensaryTheme(@Args('dispensaryId', { type: () => ID }) dispensaryId: string): Promise<any> {
    return this.themes.getDispensaryTheme(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryTheme, { name: 'setDispensaryTheme' })
  async setTheme(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('themeCode') themeCode: string,
    @Args('customCss', { nullable: true }) customCss: string,
  ): Promise<any> { return this.themes.setDispensaryTheme(dispensaryId, themeCode, customCss); }
}

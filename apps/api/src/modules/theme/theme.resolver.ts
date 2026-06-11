import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ThemeService } from './theme.service';
import {
  ThemableDispensary,
  ThemeConfigType,
  SaveThemeConfigInput,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DispensaryOwnershipService } from '../../common/services/dispensary-ownership.service';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => ThemeConfigType)
export class ThemeResolver {
  constructor(
    private readonly themeService: ThemeService,
    private readonly ownership: DispensaryOwnershipService,
  ) {}

  /**
   * Public read — every storefront / kiosk page consumes this to paint
   * the dispensary's theme. The data is already publicly visible via
   * `/css/dispensary/:id.css`, so keeping the GraphQL projection
   * unauthenticated matches that surface.
   */
  @Public()
  @Query(() => ThemeConfigType, { name: 'themeConfig' })
  async getThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<ThemeConfigType> {
    return this.themeService.getByDispensaryId(dispensaryId);
  }

  /**
   * Write path — locked to admins that own the dispensary. Until
   * sc-637-followup this mutation was completely unauthenticated and
   * any anonymous caller could rewrite any tenant's palette.
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ThemeConfigType, { name: 'saveThemeConfig' })
  async saveThemeConfig(
    @Args('input') input: SaveThemeConfigInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ThemeConfigType> {
    await this.ownership.assertOwns(user, input.dispensaryId);
    return this.themeService.save(input);
  }

  /**
   * Returns the dispensaries the current admin is allowed to theme.
   * The admin UI shows one card per row so an org_admin can pick which
   * site they're customizing; a dispensary_admin gets a single-row list
   * (their own).
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ThemableDispensary], { name: 'myThemableDispensaries' })
  async myThemableDispensaries(
    @CurrentUser() user: JwtPayload,
  ): Promise<ThemableDispensary[]> {
    return this.themeService.listThemableForUser(
      user.role,
      user.dispensaryId ?? null,
      user.organizationId ?? null,
    );
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ThemeConfigType, { name: 'resetThemeConfig' })
  async resetThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ThemeConfigType> {
    await this.ownership.assertOwns(user, dispensaryId);
    return this.themeService.resetToDefault(dispensaryId);
  }
}

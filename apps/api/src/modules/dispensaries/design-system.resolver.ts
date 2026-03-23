import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispensary } from './entities/dispensary.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class DesignSystemConfig {
  @Field()
  designSystem!: string;

  @Field()
  designSystemFile!: string;
}

@Resolver()
export class DesignSystemResolver {
  constructor(
    @InjectRepository(Dispensary)
    private readonly dispensaryRepo: Repository<Dispensary>,
  ) {}

  // Public — storefront reads this to know which CSS to load
  @Public()
  @Query(() => DesignSystemConfig, { name: 'designSystemConfig' })
  async getDesignSystem(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<DesignSystemConfig> {
    const dispensary = await this.dispensaryRepo.findOne({
      where: { entity_id: dispensaryId },
      select: ['design_system', 'design_system_file'],
    });

    return {
      designSystem: dispensary?.design_system ?? 'casual',
      designSystemFile: dispensary?.design_system_file ?? 'casual.css',
    };
  }

  // Admin — set the active design system
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DesignSystemConfig, { name: 'setDesignSystem' })
  async setDesignSystem(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('designSystem') designSystem: string,
    @Args('designSystemFile') designSystemFile: string,
  ): Promise<DesignSystemConfig> {
    // Scope check: dispensary admins can only update their own
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }

    await this.dispensaryRepo.update(
      { entity_id: dispensaryId },
      {
        design_system: designSystem,
        design_system_file: designSystemFile,
      },
    );

    return { designSystem, designSystemFile };
  }
}

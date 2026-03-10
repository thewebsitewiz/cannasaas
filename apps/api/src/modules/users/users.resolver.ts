import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => User, { name: 'me' })
  async me(@CurrentUser() currentUser: JwtPayload): Promise<User> {
    const user = await this.users.findById(currentUser.sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => User, { name: 'user', nullable: true })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<User | null> {
    const user = await this.users.findById(id);
    if (!user) return null;
    if (currentUser.role === 'dispensary_admin' && user.dispensaryId !== currentUser.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return user;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [User], { name: 'usersByDispensary' })
  async findByDispensary(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<User[]> {
    if (currentUser.role === 'dispensary_admin' && dispensaryId !== currentUser.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.users.findByDispensary(dispensaryId);
  }

  @Roles('super_admin')
  @Mutation(() => User, { name: 'setUserRole' })
  async setUserRole(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role') role: string,
  ): Promise<User> {
    return this.users.updateRole(userId, role);
  }

  @Mutation(() => Boolean, { name: 'deactivateUser' })
  async deactivateUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<boolean> {
    if (currentUser.role !== 'super_admin' && currentUser.sub !== userId) {
      throw new ForbiddenException('Access denied');
    }
    await this.users.deactivate(userId);
    return true;
  }
}

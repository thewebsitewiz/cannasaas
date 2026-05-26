import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../auth/enums/role.enum';

const VALID_ROLES: ReadonlySet<string> = new Set(Object.values(Role));

/** Roles a dispensary-admin can assign within their own dispensary. */
const TENANT_ASSIGNABLE_ROLES: ReadonlySet<string> = new Set<string>([
  Role.DISPENSARY_ADMIN,
  Role.BUDTENDER,
]);

@InputType()
class InviteStaffInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field(() => ID)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  dispensaryId!: string;

  @Field()
  @IsString()
  role!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;
}

@ObjectType()
class InviteStaffResult {
  @Field(() => User) user!: User;
  @Field() temporaryPassword!: string;
}

function assertTenantWriteScope(
  actor: JwtPayload,
  targetDispensaryId: string | undefined,
): void {
  if (actor.role === 'super_admin') return;
  if (!targetDispensaryId || actor.dispensaryId !== targetDispensaryId) {
    throw new ForbiddenException('Cross-dispensary write denied');
  }
}

function assertAssignableRole(actor: JwtPayload, requestedRole: string): void {
  if (!VALID_ROLES.has(requestedRole)) {
    throw new BadRequestException(`Invalid role: ${requestedRole}`);
  }
  if (actor.role === 'super_admin' || actor.role === 'org_admin') return;
  if (!TENANT_ASSIGNABLE_ROLES.has(requestedRole)) {
    throw new ForbiddenException(
      `Role "${requestedRole}" requires org_admin or super_admin to assign`,
    );
  }
}

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
    if (
      currentUser.role === 'dispensary_admin' &&
      user.dispensaryId !== currentUser.dispensaryId
    ) {
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
    if (
      currentUser.role === 'dispensary_admin' &&
      dispensaryId !== currentUser.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.users.findByDispensary(dispensaryId);
  }

  /**
   * Set a user's role. dispensary_admin can only set roles within their
   * own dispensary, and can only assign roles within
   * `TENANT_ASSIGNABLE_ROLES` (no promoting someone to org_admin or
   * super_admin). org_admin / super_admin have full assignment power.
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => User, { name: 'setUserRole' })
  async setUserRole(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role') role: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<User> {
    const target = await this.users.findById(userId);
    if (!target) throw new NotFoundException('User not found');
    assertTenantWriteScope(actor, target.dispensaryId);
    assertAssignableRole(actor, role);
    return this.users.updateRole(userId, role as Role);
  }

  /**
   * Deactivate a user. Allowed:
   *  - super_admin: any user
   *  - org_admin / dispensary_admin: any user in their own dispensary
   *  - any signed-in user: themselves (self-deactivate)
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Mutation(() => Boolean, { name: 'deactivateUser' })
  async deactivateUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<boolean> {
    if (actor.sub === userId) {
      await this.users.deactivate(userId);
      return true;
    }
    if (actor.role === 'super_admin') {
      await this.users.deactivate(userId);
      return true;
    }
    const target = await this.users.findById(userId);
    if (!target) throw new NotFoundException('User not found');
    assertTenantWriteScope(actor, target.dispensaryId);
    await this.users.deactivate(userId);
    return true;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InviteStaffResult, { name: 'inviteStaff' })
  async inviteStaff(
    @Args('input') input: InviteStaffInput,
    @CurrentUser() actor: JwtPayload,
  ): Promise<InviteStaffResult> {
    assertTenantWriteScope(actor, input.dispensaryId);
    assertAssignableRole(actor, input.role);
    return this.users.invite({
      email: input.email,
      dispensaryId: input.dispensaryId,
      role: input.role as Role,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }
}

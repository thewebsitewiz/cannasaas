import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]:       50,
  [Role.ORG_ADMIN]:         40,
  [Role.DISPENSARY_ADMIN]:  30,
  [Role.BUDTENDER]:         20,
  [Role.CUSTOMER]:          10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user in context');

    const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY[r] ?? 999));

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`Requires role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin:      50,
  org_admin:        40,
  dispensary_admin: 30,
  budtender:        20,
  customer:         10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!required?.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: { user?: { role?: string } } }>().req
      ?? context.switchToHttp().getRequest<{ user?: { role?: string } }>();

    const userRole = req?.user?.role;
    if (!userRole) throw new ForbiddenException('No role in token');

    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = Math.min(...required.map(r => ROLE_HIERARCHY[r] ?? 999));

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`Requires role: ${required.join(' or ')}`);
    }
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

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
    return !!req?.user?.role && required.includes(req.user.role);
  }
}

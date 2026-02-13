// cannasaas-api/src/common/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiKeyService } from '../../modules/api-keys/api-key.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer cs_')) return false;

    const rawKey = authHeader.replace('Bearer ', '');
    const apiKey = await this.apiKeyService.validateKey(rawKey);

    const requiredPermission = this.reflector.get<string>(
      'api_permission', context.getHandler());
    if (requiredPermission && !apiKey.permissions.includes(requiredPermission))
      return false;

    request['organizationId'] = apiKey.organizationId;
    request['apiKey'] = apiKey;
    return true;
  }
}

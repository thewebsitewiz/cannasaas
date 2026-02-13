import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiKeyService } from '../../modules/api-keys/api-key.service';
import { Reflector } from '@nestjs/core';
export declare class ApiKeyGuard implements CanActivate {
    private apiKeyService;
    private reflector;
    constructor(apiKeyService: ApiKeyService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

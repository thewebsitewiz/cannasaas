import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
export declare class ApiKeyService {
    private keyRepo;
    constructor(keyRepo: Repository<ApiKey>);
    createKey(orgId: string, name: string, permissions: string[]): Promise<{
        key: string;
        id: string;
        name: string;
        permissions: string[];
    }>;
    validateKey(rawKey: string): Promise<ApiKey>;
    revokeKey(keyId: string, orgId: string): Promise<void>;
}

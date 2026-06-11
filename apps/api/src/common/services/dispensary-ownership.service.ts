import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface JwtClaims {
  readonly sub?: string;
  readonly role?: string;
  readonly dispensaryId?: string | null;
  readonly organizationId?: string | null;
}

interface DispensaryRow {
  readonly entity_id: string;
  readonly organization_id: string | null;
}

/**
 * Centralizes the "can this admin act on this dispensary?" check used
 * by the per-dispensary theming feature (and meant to be reused by
 * other tenant-scoped admin paths). Rules:
 *
 *   super_admin       → any dispensary
 *   org_admin         → any dispensary whose company belongs to the
 *                       admin's organization
 *   dispensary_admin  → only the dispensary in their JWT claim
 *
 * Throws `ForbiddenException` on any other role. Returns the resolved
 * `organizationId` so callers (like `myThemableDispensaries`) can scope
 * follow-up reads without re-querying.
 */
@Injectable()
export class DispensaryOwnershipService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async assertOwns(
    user: JwtClaims | undefined,
    dispensaryId: string,
  ): Promise<{ organizationId: string | null }> {
    if (!user || !user.role) {
      throw new ForbiddenException('Not authenticated');
    }
    if (user.role === 'super_admin') {
      return { organizationId: null };
    }
    if (user.role === 'dispensary_admin') {
      if (user.dispensaryId !== dispensaryId) {
        throw new ForbiddenException(
          'dispensary_admin cannot act on another dispensary',
        );
      }
      return { organizationId: user.organizationId ?? null };
    }
    if (user.role === 'org_admin') {
      if (!user.organizationId) {
        throw new ForbiddenException('org_admin missing organizationId claim');
      }
      const rows = (await this.ds.query(
        `SELECT d.entity_id, c.organization_id
           FROM dispensaries d
           JOIN companies c ON c.company_id = d.company_id
          WHERE d.entity_id = $1
          LIMIT 1`,
        [dispensaryId],
      )) as unknown as DispensaryRow[];
      const row = rows[0];
      if (!row) {
        throw new ForbiddenException('Dispensary not found');
      }
      if (row.organization_id !== user.organizationId) {
        throw new ForbiddenException(
          'org_admin cannot act on a dispensary outside their organization',
        );
      }
      return { organizationId: user.organizationId };
    }
    throw new ForbiddenException(
      `role "${user.role}" cannot act on dispensary themes`,
    );
  }
}

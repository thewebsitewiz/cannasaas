// cannasaas-api/src/modules/compliance/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete',
  LOGIN = 'login', LOGOUT = 'logout', ACCESS = 'access',
  EXPORT = 'export', COMPLIANCE_CHECK = 'compliance_check',
  INVENTORY_ADJUST = 'inventory_adjust', METRC_SYNC = 'metrc_sync',
  REFUND = 'refund', VOID = 'void',
}

export enum AuditSeverity { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

  async log(entry: {
    organizationId: string; userId: string;
    action: AuditAction; resource: string;
    resourceId?: string; severity: AuditSeverity;
    details: Record<string, any>;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    ipAddress?: string;
  }) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }))
      .digest('hex');

    return this.auditRepo.save(this.auditRepo.create({
      ...entry, timestamp: new Date(), hash,
    }));
  }

  async getAuditTrail(orgId: string, filters: {
    resource?: string; userId?: string; action?: AuditAction;
    startDate?: Date; endDate?: Date; page?: number; limit?: number;
  }) {
    const qb = this.auditRepo.createQueryBuilder('audit')
      .where('audit.organizationId = :orgId', { orgId })
      .orderBy('audit.timestamp', 'DESC');

    if (filters.resource) qb.andWhere('audit.resource = :r', { r: filters.resource });
    if (filters.userId) qb.andWhere('audit.userId = :u', { u: filters.userId });
    if (filters.action) qb.andWhere('audit.action = :a', { a: filters.action });
    if (filters.startDate) qb.andWhere('audit.timestamp >= :s', { s: filters.startDate });
    if (filters.endDate) qb.andWhere('audit.timestamp <= :e', { e: filters.endDate });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [logs, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async exportForRegulator(orgId: string, startDate: Date, endDate: Date) {
    const logs = await this.auditRepo.find({
      where: { organizationId: orgId, timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });

    const headers = 'Timestamp,User,Action,Resource,ResourceID,Severity,Details\n';
    const rows = logs.map(l =>
      `${l.timestamp.toISOString()},${l.userId},${l.action},${l.resource},${l.resourceId || ''},${l.severity},"${JSON.stringify(l.details).replace(/"/g, '""')}"`
    ).join('\n');
    return headers + rows;
  }
}

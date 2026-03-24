import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validateUUID } from '../../common/helpers/validation.helpers';

interface SegmentDefinition {
  name: string;
  description: string;
  query: string;
  params: (dispensaryId: string) => any[];
}

@Injectable()
export class SegmentationService {
  private readonly logger = new Logger(SegmentationService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  private getSegmentDefinitions(): SegmentDefinition[] {
    return [
      {
        name: 'High Value',
        description: 'Customers with total spend > $500 in the last 90 days',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND (
            SELECT COALESCE(SUM(o2.total), 0) FROM orders o2
            WHERE o2."customerUserId" = cp.user_id AND o2."dispensaryId" = $1
              AND o2."orderStatus" = 'completed'
              AND o2."createdAt" >= NOW() - INTERVAL '90 days'
          ) > 500
        `,
        params: (id) => [id],
      },
      {
        name: 'At Risk',
        description: 'Previously regular customers with no purchase in 30+ days',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND cp.total_orders >= 3
          AND (
            SELECT MAX(o2."createdAt") FROM orders o2
            WHERE o2."customerUserId" = cp.user_id AND o2."dispensaryId" = $1
              AND o2."orderStatus" = 'completed'
          ) < NOW() - INTERVAL '30 days'
        `,
        params: (id) => [id],
      },
      {
        name: 'New',
        description: 'Customers registered in the last 14 days',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND u."createdAt" >= NOW() - INTERVAL '14 days'
        `,
        params: (id) => [id],
      },
      {
        name: 'Medical Patients',
        description: 'Customers with medical patient status',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND cp.is_medical_patient = true
        `,
        params: (id) => [id],
      },
      {
        name: 'Loyal',
        description: 'Customers in Gold or Platinum loyalty tier',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          LEFT JOIN loyalty_members lm ON lm.user_id = cp.user_id
          LEFT JOIN loyalty_tiers lt ON lt.tier_id = lm.tier_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND lt.name IN ('Gold', 'Platinum')
        `,
        params: (id) => [id],
      },
      {
        name: 'Inactive',
        description: 'No purchase in 60+ days',
        query: `
          SELECT DISTINCT cp.user_id, u."firstName" as first_name, u."lastName" as last_name,
                 u.email, cp.total_spent, cp.total_orders
          FROM customer_profiles cp
          JOIN users u ON u.id = cp.user_id
          WHERE (cp.preferred_dispensary_id = $1 OR EXISTS (
            SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
          ))
          AND cp.total_orders > 0
          AND (
            SELECT MAX(o2."createdAt") FROM orders o2
            WHERE o2."customerUserId" = cp.user_id AND o2."dispensaryId" = $1
              AND o2."orderStatus" = 'completed'
          ) < NOW() - INTERVAL '60 days'
        `,
        params: (id) => [id],
      },
    ];
  }

  async getSegments(dispensaryId: string): Promise<{ name: string; description: string; count: number }[]> {
    validateUUID(dispensaryId, 'dispensaryId');
    const definitions = this.getSegmentDefinitions();
    const results: { name: string; description: string; count: number }[] = [];

    for (const seg of definitions) {
      const [row] = await this.ds.query(
        `SELECT COUNT(*) as count FROM (${seg.query}) sub`,
        seg.params(dispensaryId),
      );
      results.push({
        name: seg.name,
        description: seg.description,
        count: parseInt(row.count, 10),
      });
    }

    return results;
  }

  async getSegmentMembers(dispensaryId: string, segmentName: string, limit = 50, offset = 0): Promise<any[]> {
    validateUUID(dispensaryId, 'dispensaryId');
    const definitions = this.getSegmentDefinitions();
    const seg = definitions.find(d => d.name === segmentName);
    if (!seg) return [];

    const params = seg.params(dispensaryId);
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    return this.ds.query(
      `${seg.query} ORDER BY cp.total_spent DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, limit, offset],
    );
  }

  async getSegmentStats(dispensaryId: string): Promise<{ segments: { name: string; count: number }[]; totalCustomers: number }> {
    validateUUID(dispensaryId, 'dispensaryId');

    const [totalRow] = await this.ds.query(
      `SELECT COUNT(DISTINCT cp.user_id) as total
       FROM customer_profiles cp
       WHERE cp.preferred_dispensary_id = $1 OR EXISTS (
         SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
       )`,
      [dispensaryId],
    );

    const segments = await this.getSegments(dispensaryId);

    return {
      totalCustomers: parseInt(totalRow.total, 10),
      segments: segments.map(s => ({ name: s.name, count: s.count })),
    };
  }
}

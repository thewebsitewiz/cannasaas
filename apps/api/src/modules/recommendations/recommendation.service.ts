import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async getFrequentlyBoughtTogether(productId: string, dispensaryId: string, limit = 5): Promise<any[]> {
    const rows = await this.ds.query(
      `SELECT li2."productId" as "productId", p.name as "productName", COUNT(*) as "coCount"
       FROM order_line_items li1
       JOIN order_line_items li2 ON li1."orderId" = li2."orderId" AND li1."productId" != li2."productId"
       JOIN products p ON li2."productId" = p.id
       JOIN orders o ON o."orderId" = li1."orderId"
       WHERE li1."productId" = $1 AND o."dispensaryId" = $2 AND o."orderStatus" = 'completed'
       GROUP BY li2."productId", p.name
       ORDER BY "coCount" DESC
       LIMIT $3`,
      [productId, dispensaryId, limit],
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      coCount: parseInt(r.coCount, 10),
    }));
  }

  async getPopularInCategory(categoryId: string, dispensaryId: string, limit = 10): Promise<any[]> {
    const rows = await this.ds.query(
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        SUM(li.quantity) as "unitsSold"
       FROM order_line_items li
       JOIN orders o ON o."orderId" = li."orderId"
       JOIN products p ON p.id = li."productId"
       WHERE p.product_type_id = $1 AND o."dispensaryId" = $2 AND o."orderStatus" = 'completed'
       GROUP BY p.id, p.name, p.strain_type
       ORDER BY "unitsSold" DESC
       LIMIT $3`,
      [categoryId, dispensaryId, limit],
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      unitsSold: parseInt(r.unitsSold, 10),
    }));
  }

  async getPersonalizedForCustomer(userId: string, dispensaryId: string, limit = 10): Promise<any[]> {
    // Find the user's preferred strain types and effects from past purchases,
    // then recommend products with similar attributes they haven't bought yet
    const rows = await this.ds.query(
      `WITH user_prefs AS (
        SELECT DISTINCT p.strain_type, jsonb_array_elements_text(p.effects) as effect
        FROM order_line_items li
        JOIN orders o ON o."orderId" = li."orderId"
        JOIN products p ON p.id = li."productId"
        WHERE o."userId" = $1 AND o."dispensaryId" = $2 AND o."orderStatus" = 'completed'
          AND p.strain_type IS NOT NULL
      ),
      purchased AS (
        SELECT DISTINCT li."productId"
        FROM order_line_items li
        JOIN orders o ON o."orderId" = li."orderId"
        WHERE o."userId" = $1 AND o."dispensaryId" = $2
      )
      SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects as "effects",
        COUNT(DISTINCT up.effect) as "matchScore"
      FROM products p
      LEFT JOIN user_prefs up ON (p.strain_type = up.strain_type OR up.effect IN (SELECT jsonb_array_elements_text(p.effects)))
      WHERE p.dispensary_id = $2 AND p.is_active = true
        AND p.id NOT IN (SELECT "productId" FROM purchased)
        AND (up.strain_type IS NOT NULL OR up.effect IS NOT NULL)
      GROUP BY p.id, p.name, p.strain_type, p.effects
      ORDER BY "matchScore" DESC
      LIMIT $3`,
      [userId, dispensaryId, limit],
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      effects: r.effects,
      matchScore: parseInt(r.matchScore, 10),
    }));
  }

  async getTrendingProducts(dispensaryId: string, days = 7, limit = 10): Promise<any[]> {
    const rows = await this.ds.query(
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        SUM(li.quantity) as "unitsSold", COUNT(DISTINCT o."orderId") as "orderCount"
       FROM order_line_items li
       JOIN orders o ON o."orderId" = li."orderId"
       JOIN products p ON p.id = li."productId"
       WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
         AND o."createdAt" >= NOW() - INTERVAL '1 day' * $2
       GROUP BY p.id, p.name, p.strain_type
       ORDER BY "unitsSold" DESC
       LIMIT $3`,
      [dispensaryId, days, limit],
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      unitsSold: parseInt(r.unitsSold, 10),
      orderCount: parseInt(r.orderCount, 10),
    }));
  }
}

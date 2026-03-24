import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ChangelogService implements OnModuleInit {
  private readonly logger = new Logger(ChangelogService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS changelog_entries (
          entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          version VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'feature',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Seed initial entries if table is empty
      const [{ count }] = await this.ds.query('SELECT COUNT(*)::int as count FROM changelog_entries');
      if (count === 0) {
        await this.ds.query(`
          INSERT INTO changelog_entries (version, title, description, category, created_at) VALUES
          ('0.1.0', 'Multi-tenant dispensary platform', 'Full multi-tenant architecture with organization, company, and dispensary hierarchy. Tenant isolation via middleware.', 'feature', '2025-01-15'),
          ('0.2.0', 'Product catalog & inventory management', 'Complete product data model with cannabis-specific attributes (THC/CBD, strain type, effects). Real-time inventory tracking with lot control.', 'feature', '2025-02-01'),
          ('0.3.0', 'Order management system', 'Full order lifecycle — cart, checkout, fulfillment. Supports pickup and delivery with real-time status updates.', 'feature', '2025-02-20'),
          ('0.4.0', 'Compliance & METRC integration', 'State compliance tracking, purchase limits, and METRC/BioTrack API integration for seed-to-sale traceability.', 'feature', '2025-03-10'),
          ('0.5.0', 'Stripe payment integration', 'Payment intents, webhooks, and refund processing via Stripe. PCI-compliant card handling.', 'feature', '2025-04-01'),
          ('0.6.0', 'Loyalty & rewards program', 'Points-based loyalty system with tiered rewards. Automatic point accrual on purchases.', 'feature', '2025-04-15'),
          ('0.7.0', 'White-label theming', 'Per-dispensary theme customization — colors, logos, fonts. Theme preview and live switching.', 'feature', '2025-05-01'),
          ('0.8.0', 'Staff scheduling & time clock', 'Employee scheduling with shift management. Clock in/out with geofencing support.', 'feature', '2025-05-20'),
          ('0.9.0', 'Platform admin dashboard', 'Super-admin portal for tenant management, billing oversight, tax administration, and platform-wide analytics.', 'feature', '2025-06-05'),
          ('0.10.0', 'Spanish language support (i18n)', 'Storefront internationalization with English and Spanish translations. Browser-detected locale with manual toggle.', 'feature', '2025-06-20'),
          ('0.10.1', 'White-label email templates', 'Branded HTML email templates for order confirmation, delivery updates, welcome, loyalty milestones, back-in-stock alerts, and weekly digests.', 'improvement', '2025-06-22'),
          ('0.10.2', 'System status page', 'Public /status endpoint with service health checks (database, API, GraphQL) and uptime reporting.', 'improvement', '2025-06-23'),
          ('0.10.3', 'In-app changelog', 'Release notes timeline in admin portal with "What''s New" badge indicator.', 'feature', '2025-06-24')
        `);
        this.logger.log('Seeded changelog entries');
      }
    } catch (err) {
      this.logger.warn('Could not initialize changelog table: ' + (err as Error).message);
    }
  }

  async getChangelog(limit = 50): Promise<any[]> {
    return this.ds.query(
      'SELECT * FROM changelog_entries ORDER BY created_at DESC LIMIT $1',
      [limit],
    );
  }

  async createEntry(version: string, title: string, description: string, category = 'feature'): Promise<any> {
    const [entry] = await this.ds.query(
      'INSERT INTO changelog_entries (version, title, description, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [version, title, description, category],
    );
    return entry;
  }

  async getLatestVersion(): Promise<string | null> {
    const [row] = await this.ds.query(
      'SELECT version FROM changelog_entries ORDER BY created_at DESC LIMIT 1',
    );
    return row?.version || null;
  }
}

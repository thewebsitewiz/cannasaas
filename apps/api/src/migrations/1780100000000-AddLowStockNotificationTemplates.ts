import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the two `notification_templates` rows the NotificationService
 * `inventory.low_stock` / `inventory.out_of_stock` listeners look up
 * by code (sc-113). Idempotent: `INSERT ... ON CONFLICT (code) DO NOTHING`.
 *
 * `template_id` is a SERIAL integer (auto-assigned), so we omit it.
 * The table has no `created_at` / `updated_at` columns — see the
 * NotificationTemplate entity in `modules/notifications/entities`.
 */
export class AddLowStockNotificationTemplates1780100000000
  implements MigrationInterface
{
  name = 'AddLowStockNotificationTemplates1780100000000';

  public async up(qr: QueryRunner): Promise<void> {
    const lowSubject = 'Low stock: {{productName}} ({{dispensaryName}})';
    const lowBody = `Hi {{firstName}},

{{productName}} at {{dispensaryName}} is running low. Current available quantity: {{quantity}}.

Set or adjust reorder thresholds in the admin: {{adminUrl}}

— CannaSaaS`;

    const outSubject = 'OUT OF STOCK: {{productName}} ({{dispensaryName}})';
    const outBody = `Hi {{firstName}},

{{productName}} at {{dispensaryName}} is OUT OF STOCK. Customers will see this variant marked unavailable on the storefront until inventory is replenished.

Restock or adjust in the admin: {{adminUrl}}

— CannaSaaS`;

    await qr.query(
      `INSERT INTO notification_templates (code, name, channel, subject, body_template, is_active)
       VALUES
         ('low_stock_alert', 'Low stock alert (staff)', 'email', $1, $2, TRUE),
         ('out_of_stock_alert', 'Out of stock alert (staff)', 'email', $3, $4, TRUE)
       ON CONFLICT (code) DO NOTHING`,
      [lowSubject, lowBody, outSubject, outBody],
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(
      `DELETE FROM notification_templates
       WHERE code IN ('low_stock_alert', 'out_of_stock_alert')`,
    );
  }
}

const fs = require('fs');
const path = require('path');
const BASE = __dirname;

function transformFile(relPath) {
  const fp = path.join(BASE, relPath);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found): ' + relPath); return; }

  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes("Symbol.for('DRIZZLE')")) { console.log('SKIP (done): ' + relPath); return; }
  if (!c.includes('typeorm') && !c.includes('InjectDataSource') && !c.includes('InjectRepository')) {
    console.log('SKIP (no typeorm): ' + relPath); return;
  }

  // Detect variable names
  const hasDsVar = c.includes('private ds:') || c.includes('private ds :');
  const hasDataSourceVar = c.includes('private dataSource:') || c.includes('private dataSource :');

  // 1. Remove all typeorm imports
  c = c.replace(/import\s*\{[^}]*\}\s*from\s*'typeorm';\n?/g, '');
  c = c.replace(/import\s*\{[^}]*\}\s*from\s*'@nestjs\/typeorm';\n?/g, '');

  // 2. Ensure Inject is in @nestjs/common imports
  const commonImportMatch = c.match(/import\s*\{([^}]+)\}\s*from\s*'@nestjs\/common'/);
  if (commonImportMatch && !commonImportMatch[1].includes('Inject')) {
    c = c.replace(
      /import\s*\{([^}]+)\}\s*from\s*'@nestjs\/common'/,
      (m, imports) => {
        const trimmed = imports.trim();
        return `import { Inject, ${trimmed} } from '@nestjs/common'`;
      }
    );
  }

  // 3. Add drizzle-orm import and DRIZZLE symbol
  // Find end of imports block
  const lines = c.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i]) || (lastImportLine >= 0 && i === lastImportLine + 1 && /^\s*(from\s|})/.test(lines[i]))) {
      // Track multi-line imports
    }
    if (lines[i].includes("from '") || lines[i].includes('from "')) {
      lastImportLine = i;
    }
  }

  const needsQuery = c.includes('.query(') || hasDsVar || hasDataSourceVar;
  const inserts = [];
  if (needsQuery) inserts.push("import { sql } from 'drizzle-orm';");
  inserts.push('');
  inserts.push("export const DRIZZLE = Symbol.for('DRIZZLE');");
  inserts.push('');

  lines.splice(lastImportLine + 1, 0, ...inserts);
  c = lines.join('\n');

  // 4. Replace @InjectDataSource() constructor params
  c = c.replace(/@InjectDataSource\(\)\s*private\s+dataSource:\s*DataSource/g, '@Inject(DRIZZLE) private db: any');
  c = c.replace(/@InjectDataSource\(\)\s*private\s+ds:\s*DataSource/g, '@Inject(DRIZZLE) private db: any');

  // 5. Remove @InjectRepository lines
  c = c.replace(/\s*@InjectRepository\([^)]+\)\s*private\s+\w+:\s*Repository<[^>]+>,?\n?/g, '\n');

  // 6. Clean up constructor formatting
  c = c.replace(/\n{3,}/g, '\n\n');
  c = c.replace(/,\s*\n(\s*\)\s*\{)/g, '\n$1');
  c = c.replace(/,(\s*\)\s*\{)/g, '$1');
  // Also fix: constructor(\n\n  private => constructor(\n  private
  c = c.replace(/(constructor\()\s*\n\s*\n/g, '$1\n');

  // 7. Replace variable references in code
  if (hasDataSourceVar) {
    // Replace this.dataSource.query( with this._q(
    // Replace this.dataSource.createQueryRunner() with transaction pattern
    c = c.replace(/this\.dataSource\.query\(/g, 'this._q(');
    c = c.replace(/this\.dataSource/g, 'this.db');
  }
  if (hasDsVar) {
    c = c.replace(/this\.ds\.query\(/g, 'this._q(');
    c = c.replace(/this\.ds/g, 'this.db');
  }

  // 8. Replace repo method calls with _q-based equivalents
  // For common patterns:
  // this.xxxRepo.find({ where: {...}, order: {...}, take: N }) -> this._q(SQL)
  // this.xxxRepo.findOne({ where: {...} }) -> (await this._q(SQL))[0]
  // this.xxxRepo.save(entity) -> this._q(INSERT/UPDATE SQL)
  // this.xxxRepo.create({...}) -> plain object creation
  // this.xxxRepo.update(criteria, values) -> this._q(UPDATE SQL)
  // this.xxxRepo.delete(criteria) -> this._q(DELETE SQL)
  // this.xxxRepo.count({ where: {...} }) -> this._q(SELECT COUNT SQL)
  // this.xxxRepo.createQueryBuilder('alias') -> raw SQL

  // These are complex transformations. For repo-heavy services,
  // I'll leave the repo references and the developer will see compile errors.
  // But let me handle the most common patterns where possible.

  // Replace all remaining repo references with TODO comments
  // Actually - let me just handle this: the repos were removed from constructor,
  // so any this.xxxRepo calls will fail. We need to convert them.

  // For each repo call, extract the table name from the entity and convert
  // This is too complex for automated conversion, so let me handle each file manually
  // after the automated pass.

  // 9. Add _q helper if .query( was used
  if (c.includes('this._q(') && !c.includes('private async _q(')) {
    // Insert helper before the last closing brace of the class
    const lastBrace = c.lastIndexOf('}');
    const helper = `
  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

`;
    c = c.slice(0, lastBrace) + helper + c.slice(lastBrace);
  }

  // 10. Handle createQueryRunner patterns -> transaction pattern
  // this.db.createQueryRunner() needs to become this.db.transaction()
  // These are complex - will handle in manual pass

  fs.writeFileSync(fp, c);
  console.log('OK: ' + relPath);
}

function transformModule(relPath) {
  const fp = path.join(BASE, relPath);
  if (!fs.existsSync(fp)) { console.log('SKIP module (not found): ' + relPath); return; }

  let c = fs.readFileSync(fp, 'utf8');

  // Remove TypeOrmModule import
  c = c.replace(/import\s*\{\s*TypeOrmModule\s*\}\s*from\s*'@nestjs\/typeorm';\n?/g, '');

  // Remove entity imports that were only used in TypeOrmModule.forFeature
  // Keep entity imports if referenced elsewhere

  // Remove TypeOrmModule.forFeature([...]) from imports array
  c = c.replace(/\s*TypeOrmModule\.forFeature\(\[[^\]]*\]\),?\s*/g, '');

  // Clean up empty imports array
  c = c.replace(/imports:\s*\[\s*\],?\s*\n?/g, '');
  // But keep imports if there are other items
  c = c.replace(/imports:\s*\[\s*,/g, 'imports: [');

  // Remove unused entity imports (if the entity name only appeared in the forFeature call)
  // This is complex - skip for now, unused imports won't cause runtime issues

  // Remove TypeOrmModule from exports
  c = c.replace(/TypeOrmModule,?\s*/g, '');
  // Clean trailing comma in exports
  c = c.replace(/,\s*\]/g, ']');

  // Clean up double blank lines
  c = c.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(fp, c);
  console.log('OK module: ' + relPath);
}

// ============ TRANSFORM ALL SERVICE FILES ============

const serviceFiles = [
  'analytics/analytics.service.ts',
  'biotrack/biotrack.service.ts',
  'brands/brands.service.ts',
  'companies/companies.service.ts',
  'compliance/compliance.service.ts',
  'compliance/compliance-alerts.service.ts',
  'customers/customer.service.ts',
  'dispensaries/dispensaries.service.ts',
  'fulfillment/fulfillment.service.ts',
  'image/image.controller.ts',
  'inventory/inventory.service.ts',
  'inventory/reorder-suggestion.service.ts',
  'inventory-control/inventory-control.service.ts',
  'knowledge/knowledge.service.ts',
  'loyalty/loyalty.service.ts',
  'manufacturers/manufacturers.service.ts',
  'marketing/marketing.service.ts',
  'metrc/metrc.service.ts',
  'metrc/metrc-api.client.ts',
  'metrc/queue/metrc-sync.processor.ts',
  'metrc/queue/metrc-sync.queue-service.ts',
  'metrc/cron/metrc-inventory-sync.cron.ts',
  'notifications/notification.service.ts',
  'organizations/organizations.service.ts',
  'payments/cashless-payments.service.ts',
  'platform/platform.service.ts',
  'pos/pos.service.ts',
  'product-data/otreeba.service.ts',
  'product-data/product-enrichment.service.ts',
  'promotions/promotions.service.ts',
  'recommendations/recommendation.service.ts',
  'reporting/reporting.service.ts',
  'scheduling/scheduling.service.ts',
  'search/search.service.ts',
  'staffing/staffing.service.ts',
  'stripe/stripe.service.ts',
  'stripe/stripe-webhook.processor.ts',
  'tenant/tenant.service.ts',
  'theme/theme.service.ts',
  'timeclock/timeclock.service.ts',
  'vendor/vendor.service.ts',
  'verification/id-verification.service.ts',
];

const moduleFiles = [
  'biotrack/biotrack.module.ts',
  'brands/brands.module.ts',
  'companies/companies.module.ts',
  'compliance/compliance.module.ts',
  'customers/customer.module.ts',
  'dispensaries/dispensaries.module.ts',
  'fulfillment/fulfillment.module.ts',
  'inventory/inventory.module.ts',
  'inventory-control/inventory-control.module.ts',
  'manufacturers/manufacturers.module.ts',
  'metrc/metrc.module.ts',
  'notifications/notification.module.ts',
  'organizations/organizations.module.ts',
  'payments/payments.module.ts',
  'pos/pos.module.ts',
  'product-data/product-data.module.ts',
  'promotions/promotions.module.ts',
  'scheduling/scheduling.module.ts',
  'staffing/staffing.module.ts',
  'tenant/tenant.module.ts',
  'theme/theme.module.ts',
  'timeclock/timeclock.module.ts',
];

console.log('=== Transforming service files ===');
for (const f of serviceFiles) transformFile(f);

console.log('\n=== Transforming module files ===');
for (const f of moduleFiles) transformModule(f);

console.log('\nAll done!');

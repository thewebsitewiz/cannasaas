/**
 * Tenant-isolation audit (sc-609).
 *
 * Walks every `*.resolver.ts` under `src/modules/`, finds resolver
 * methods that take a `dispensaryId` GraphQL argument, and classifies
 * whether the method body contains an explicit caller-tenant scope
 * check (the `user.dispensaryId !== dispensaryId` ForbiddenException
 * pattern used by payment / customer resolvers today).
 *
 * Output: a Markdown table at `apps/api/docs/tenant-isolation-audit.md`.
 *
 * Status:
 *   - `explicit`  — body throws `ForbiddenException` and references
 *                   `user.dispensaryId` or `user.role`.
 *   - `delegated` — short method body that just calls a service; the
 *                   service is responsible for tenant filtering. The
 *                   integration spec verifies a few of these at runtime.
 *   - `missing`   — non-trivial body with no inline check. Manual review.
 *
 * Usage:
 *   pnpm --filter @cannasaas/api exec ts-node --transpile-only \
 *     scripts/tenant-isolation-audit.ts
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, relative } from 'path';

interface AuditRow {
  endpoint: string;
  decorator: 'Query' | 'Mutation';
  file: string;
  line: number;
  status: 'explicit' | 'delegated' | 'missing' | 'public';
  notes: string;
}

const REPO_ROOT = join(__dirname, '..', '..', '..');
const API_SRC = join(REPO_ROOT, 'apps', 'api', 'src');
const OUTPUT = join(
  REPO_ROOT,
  'apps',
  'api',
  'docs',
  'tenant-isolation-audit.md',
);

function walkResolvers(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkResolvers(full));
    else if (entry.isFile() && entry.name.endsWith('.resolver.ts'))
      out.push(full);
  }
  return out;
}

/** Find the closing brace of the method body that starts at openIndex. */
function findMethodEnd(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return text.length;
}

function inspectResolver(path: string): AuditRow[] {
  const text = readFileSync(path, 'utf-8');
  const rows: AuditRow[] = [];

  // Scan every `@Query(...)` and `@Mutation(...)` decorator.
  const decoratorRegex = /@(Query|Mutation)\(/g;
  let match: RegExpExecArray | null;
  while ((match = decoratorRegex.exec(text)) !== null) {
    const decorator = match[1] as 'Query' | 'Mutation';
    const decoratorOffset = match.index;

    // The method body is the next `{ ... }` block whose `{` follows the
    // signature `)` after the decorator.
    const sigParenClose = text.indexOf(')', decoratorOffset);
    if (sigParenClose === -1) continue;
    // Walk forward past additional `)` characters (multi-param sigs).
    // Find the first `{` after we've left the parameter parens — we do
    // this by counting parens from the decorator forward.
    let parenDepth = 0;
    let cursor = decoratorOffset;
    let methodOpenBrace = -1;
    while (cursor < text.length) {
      const ch = text[cursor];
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;
      else if (ch === '{' && parenDepth === 0) {
        methodOpenBrace = cursor;
        break;
      }
      cursor++;
    }
    if (methodOpenBrace === -1) continue;

    const methodEnd = findMethodEnd(text, methodOpenBrace);
    const signature = text.slice(decoratorOffset, methodOpenBrace);
    const body = text.slice(methodOpenBrace, methodEnd + 1);

    if (!/@Args\(\s*['"]dispensaryId['"]/.test(signature)) continue;

    // Method name extraction: skip past the decorator's own parens.
    // Signature is `@Query(...)`-then-newlines-then-`[async] methodName(`.
    // Find the decorator's matching `)`, then the next identifier+`(` is the method.
    let parenDepth2 = 0;
    let decoratorClose = -1;
    for (let i2 = 0; i2 < signature.length; i2++) {
      const ch = signature[i2];
      if (ch === '(') parenDepth2++;
      else if (ch === ')') {
        parenDepth2--;
        if (parenDepth2 === 0) {
          decoratorClose = i2;
          break;
        }
      }
    }
    const afterDecorator =
      decoratorClose >= 0 ? signature.slice(decoratorClose + 1) : signature;
    const nameMatch = afterDecorator.match(/(?:async\s+)?(\w+)\s*\(/);
    const methodName = nameMatch?.[1] ?? '(unknown)';

    const hasForbidden = /ForbiddenException/.test(body);
    const referencesUserScope =
      /user\.dispensaryId|user\.role|@CurrentUser/.test(body) ||
      /user\.dispensaryId|user\.role|@CurrentUser/.test(signature);
    // Look backwards from the decorator to find adjacent @Public / @Roles.
    const preamble = text.slice(
      Math.max(0, decoratorOffset - 400),
      decoratorOffset,
    );
    const isPublic = /@Public\(\)/.test(preamble);

    let status: AuditRow['status'];
    let notes = '';
    if (isPublic) {
      status = 'public';
      notes = '@Public — tenant arg is part of the public surface';
    } else if (hasForbidden && referencesUserScope) {
      status = 'explicit';
      notes = 'inline ForbiddenException + user.dispensaryId scope check';
    } else if (body.length < 400) {
      status = 'delegated';
      notes = 'short pass-through to service; service must scope';
    } else {
      status = 'missing';
      notes = 'non-trivial body with no inline check';
    }

    const line = text.slice(0, decoratorOffset).split('\n').length;
    rows.push({
      endpoint: methodName,
      decorator,
      file: relative(REPO_ROOT, path),
      line,
      status,
      notes,
    });
  }
  return rows;
}

function render(rows: AuditRow[]): string {
  const byStatus: Record<AuditRow['status'], AuditRow[]> = {
    explicit: [],
    delegated: [],
    missing: [],
    public: [],
  };
  for (const row of rows) byStatus[row.status].push(row);

  let md = `# Tenant Isolation Audit\n\n`;
  md += `Generated by [\`apps/api/scripts/tenant-isolation-audit.ts\`](../scripts/tenant-isolation-audit.ts). Static analysis only — see [\`test/integration/tenant-isolation.spec.ts\`](../test/integration/tenant-isolation.spec.ts) for runtime checks on a representative sample.\n\n`;
  md += `## Summary\n\n`;
  md += `| Status | Count | Meaning |\n`;
  md += `| --- | --- | --- |\n`;
  md += `| explicit | ${byStatus.explicit.length} | Method body throws \`ForbiddenException\` on cross-dispensary access. |\n`;
  md += `| delegated | ${byStatus.delegated.length} | Method delegates to a service. Static analysis can't verify; integration tests must. |\n`;
  md += `| public | ${byStatus.public.length} | \`@Public()\` — tenant id is part of the public surface area. |\n`;
  md += `| missing | ${byStatus.missing.length} | Non-trivial method body with no inline check. Manual review required. |\n\n`;

  for (const status of ['missing', 'public', 'delegated', 'explicit'] as const) {
    if (byStatus[status].length === 0) continue;
    md += `## ${status}\n\n`;
    md += `| Endpoint | Type | Location | Notes |\n`;
    md += `| --- | --- | --- | --- |\n`;
    for (const row of byStatus[status]) {
      md += `| \`${row.endpoint}\` | ${row.decorator} | [${row.file}:${row.line}](../../../${row.file}#L${row.line}) | ${row.notes} |\n`;
    }
    md += `\n`;
  }
  return md;
}

function main(): void {
  const files = walkResolvers(API_SRC);
  const rows: AuditRow[] = [];
  for (const f of files) rows.push(...inspectResolver(f));
  rows.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
  const md = render(rows);
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, md, 'utf-8');
  console.log(
    `Wrote ${OUTPUT} (${rows.length} dispensary-scoped endpoints).`,
  );
}

main();

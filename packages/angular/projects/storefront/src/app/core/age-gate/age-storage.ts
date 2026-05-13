/**
 * 24-hour age verification persistence, keyed by tenant slug.
 *
 * Note: the storefront CLAUDE.md specifies keying by dispensary ID. Until the
 * DispensaryBySlug GraphQL lookup is wired, the slug is the only stable
 * tenant identifier available at age-gate time. Migrate the key once the
 * resolver returns a real Dispensary.
 */

const KEY_PREFIX = 'cs:age-verified:';
const TTL_MS = 24 * 60 * 60 * 1000;

interface VerifiedRecord {
  readonly at: number;
}

export function isVerified(tenantKey: string): boolean {
  const raw = read(`${KEY_PREFIX}${tenantKey}:1`);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Partial<VerifiedRecord>;
    if (typeof parsed.at !== 'number') return false;
    return Date.now() - parsed.at < TTL_MS;
  } catch {
    return false;
  }
}

export function markVerified(tenantKey: string): void {
  const record: VerifiedRecord = { at: Date.now() };
  write(`${KEY_PREFIX}${tenantKey}:1`, JSON.stringify(record));
}

export function clearVerified(tenantKey: string): void {
  write(`${KEY_PREFIX}${tenantKey}:1`, null);
}

function read(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function write(key: string, value: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

/**
 * Single source of truth for the list of allowed browser origins.
 *
 * Resolved at module load time because some consumers (notably the WS
 * @WebSocketGateway decorator) need the value before ConfigService exists.
 * If `CORS_ORIGINS` is unset in dev, we fall back to a dev-default list
 * and log a warning. In production we fail-fast — a wrong-origin allowlist
 * silently shipped to prod is worse than not booting (architecture.md §7 #11).
 */
const DEFAULT_DEV_ORIGINS = [
  // React apps (51xx) — only platform remains post-cutover (sc-626)
  'http://localhost:5177', // platform
  // Angular apps (52xx — same last digit as their React predecessor where applicable)
  'http://localhost:5273', // storefront
  'http://localhost:5274', // admin
  'http://localhost:5275', // staff
  'http://localhost:5276', // kiosk
].join(',');

const corsOriginsEnv = process.env['CORS_ORIGINS'];
if (!corsOriginsEnv) {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(
      '[cors-origins] CORS_ORIGINS is required in production (NODE_ENV=production). ' +
        'Set it to a comma-separated list of allowed origins, e.g. ' +
        '"https://admin.cannasaas.com,https://app.cannasaas.com".',
    );
  }
  console.warn(
    '[cors-origins] CORS_ORIGINS not set — using dev defaults. ' +
      'Set CORS_ORIGINS in your environment for production deployments.',
  );
}

export const ALLOWED_ORIGINS: readonly string[] = (
  corsOriginsEnv || DEFAULT_DEV_ORIGINS
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

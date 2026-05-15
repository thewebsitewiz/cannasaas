/**
 * Single source of truth for the list of allowed browser origins.
 *
 * Resolved at module load time because some consumers (notably the WS
 * @WebSocketGateway decorator) need the value before ConfigService exists.
 * If `CORS_ORIGINS` is unset, we fall back to a dev-default list and log a
 * warning so a misconfigured production environment surfaces loudly instead
 * of silently dropping handshakes / CSRF-rejecting POSTs.
 */
const DEFAULT_DEV_ORIGINS = [
  // React apps (51xx)
  'http://localhost:5174', // admin
  'http://localhost:5175', // staff
  'http://localhost:5177', // platform
  'http://localhost:5178',
  // Angular apps (52xx — same last digit as their React predecessor where applicable)
  'http://localhost:5273', // storefront
  'http://localhost:5276', // kiosk
].join(',');

const corsOriginsEnv = process.env['CORS_ORIGINS'];
if (!corsOriginsEnv) {
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

#!/usr/bin/env zsh
# =============================================================================
# CannaSaas — Part 5: Authentication & Multi-Tenant Wiring
# Scaffold Script  |  Version 3.0  |  February 2026
# =============================================================================
#
# COVERS SECTION 5  (lines 1927–2308 of CannaSaas-PublicBeta-DeepDive.md)
#
#   5.1  TenantProvider
#          apps/storefront/src/providers/TenantProvider.tsx
#
#   5.2  Auth Route Guards
#          apps/storefront/src/components/ProtectedRoute.tsx
#
#   5.3  Login Page with Full Form Validation
#          apps/storefront/src/pages/Auth/LoginPage.tsx
#
#   +    useAuth hook  (useLogin consumed by LoginPage — must be implemented
#          packages/api-client/src/hooks/useAuth.ts
#        for the storefront to compile; not re-shown in the doc because it
#        was stubbed in Part 4 and its full implementation is implied here)
#
# DOES NOT INCLUDE
#   Section 6 (ThemeProvider)  — that is packages/ui, covered in Part 6
#   Section 7 (Storefront pages) — covered in Part 7
#
# RELATIONSHIP TO PRIOR PARTS
#   Requires Part 3 (monorepo skeleton) and Part 4 (shared packages) to have
#   been run first. Assumes cannasaas-platform/ already exists.
#
# USAGE
#   zsh scaffold-cannasaas-part5.zsh                  # uses ./cannasaas-platform
#   zsh scaffold-cannasaas-part5.zsh ~/projects       # uses ~/projects/cannasaas-platform
#   zsh scaffold-cannasaas-part5.zsh ~/projects --skip-existing
#
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
autoload -U colors && colors
info()    { print -P "%F{cyan}  ▸%f  $*" }
ok()      { print -P "%F{green}  ✔%f  $*" }
skip()    { print -P "%F{yellow}  ↷%f  $* (skipped — already exists)" }
warn()    { print -P "%F{yellow}  ⚠%f  $*" }
section() { print -P "\n%F{magenta}%B── $* ──%b%f" }
err()     { print -P "%F{red}  ✘%f  $*" >&2; exit 1 }

# ── Argument parsing ─────────────────────────────────────────────────────────
SKIP_EXISTING=false
BASE=""

for arg in "$@"; do
  case "$arg" in
    --skip-existing) SKIP_EXISTING=true ;;
    *)               BASE="$arg" ;;
  esac
done

BASE="${BASE:-$(pwd)}"
ROOT="${BASE}/cannasaas-platform"

[[ -d "${ROOT}" ]] || err "cannasaas-platform/ not found at ${ROOT}\nRun Part 3 scaffold first."

print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  CannaSaas · Part 5 — Auth & Tenant Wiring   ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f\n"
info "Target root: ${ROOT}"
[[ "${SKIP_EXISTING}" == "true" ]] && \
  warn "Skip-existing mode ON — existing files will NOT be overwritten"

# ── File writer ───────────────────────────────────────────────────────────────
# Default: always writes (replaces Part 4 stubs).
# --skip-existing: idempotent, safe after manual edits.
write_file() {
  local target="$1"
  if [[ "${SKIP_EXISTING}" == "true" && -f "$target" ]]; then
    skip "$target"
    cat > /dev/null
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  cat > "$target"
  ok "Wrote $target"
}

mkd() {
  [[ -d "$1" ]] || { mkdir -p "$1"; ok "(dir) $1"; }
}

# =============================================================================
# SECTION 5.1 — TenantProvider
# apps/storefront/src/providers/TenantProvider.tsx
# =============================================================================
section "5.1 · TenantProvider"

mkd "${ROOT}/apps/storefront/src/providers"

write_file "${ROOT}/apps/storefront/src/providers/TenantProvider.tsx" <<'HEREDOC'
// apps/storefront/src/providers/TenantProvider.tsx
import React, { useEffect, type ReactNode } from 'react';
import { apiClient } from '@cannasaas/api-client';
import { useOrganizationStore, useCurrentTenant } from '@cannasaas/stores';
import type { TenantContext } from '@cannasaas/types';
import { FullPageLoader } from '@cannasaas/ui';

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * TenantProvider resolves the current dispensary from the domain/subdomain
 * and populates the organization store before rendering children.
 *
 * Flow:
 * 1. Read hostname (e.g., shop.greenleafbrooklyn.com)
 * 2. Call GET /tenants/resolve?domain=shop.greenleafbrooklyn.com
 * 3. Receive { organizationId, dispensaryId, brandingConfig, ... }
 * 4. Store in organizationStore
 * 5. Render children — all API calls now have tenant context
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const { setTenant, setResolving, isResolving } = useOrganizationStore();
  const tenant = useCurrentTenant();

  useEffect(() => {
    async function resolveTenant() {
      const hostname = window.location.hostname;

      try {
        const { data } = await apiClient.get<{ data: TenantContext }>(
          '/tenants/resolve',
          { params: { domain: hostname } },
        );
        setTenant(data.data);
      } catch (error) {
        // Dev fallback: use env-configured default dispensary
        const fallbackDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID;
        if (fallbackDispensaryId) {
          setTenant({
            organizationId: import.meta.env.VITE_DEFAULT_ORG_ID,
            organizationName: 'Development',
            dispensaryId: fallbackDispensaryId,
            dispensaryName: 'Dev Dispensary',
            subdomain: 'localhost',
          });
        } else {
          console.error('Tenant resolution failed and no fallback configured');
        }
      } finally {
        setResolving(false);
      }
    }

    resolveTenant();
  }, [setTenant, setResolving]);

  if (isResolving) {
    return <FullPageLoader message="Loading dispensary..." />;
  }

  if (!tenant) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <p className="text-[var(--color-error)]">
          Unable to locate this dispensary. Please check the URL.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
HEREDOC

# =============================================================================
# SECTION 5.2 — Auth Route Guards
# apps/storefront/src/components/ProtectedRoute.tsx
# =============================================================================
section "5.2 · ProtectedRoute"

mkd "${ROOT}/apps/storefront/src/components"

write_file "${ROOT}/apps/storefront/src/components/ProtectedRoute.tsx" <<'HEREDOC'
// apps/storefront/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from '@cannasaas/stores';
import type { UserRole } from '@cannasaas/types';
import { FullPageLoader } from '@cannasaas/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute — Guards authenticated-only pages.
 *
 * During initial load (isLoading=true), shows a spinner.
 * If unauthenticated, redirects to /auth/login with return URL.
 * If authenticated but missing required role, redirects to /unauthorized.
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { isLoading, user } = useAuthStore();

  // Still hydrating from sessionStorage
  if (isLoading) {
    return <FullPageLoader message="Verifying session..." />;
  }

  // Not logged in — preserve intended destination for post-login redirect
  if (!isAuthenticated) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Logged in but missing required role
  if (requiredRoles.length > 0 && user) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
HEREDOC

# =============================================================================
# SECTION 5.3 — Login Page with Full Form Validation
# apps/storefront/src/pages/Auth/LoginPage.tsx
# =============================================================================
section "5.3 · LoginPage"

mkd "${ROOT}/apps/storefront/src/pages/Auth"

write_file "${ROOT}/apps/storefront/src/pages/Auth/LoginPage.tsx" <<'HEREDOC'
// apps/storefront/src/pages/Auth/LoginPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '@cannasaas/utils';
import { Button } from '@cannasaas/ui';
import { useLogin } from '@cannasaas/api-client';
import { useCurrentTenant } from '@cannasaas/stores';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useCurrentTenant();
  const { mutateAsync: login, isPending, error } = useLogin();

  // Return to originally intended page after login
  const from = (location.state as { from?: string })?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch {
      // Set a root-level form error — displayed in a live region
      setError('root', {
        message: 'Invalid email or password. Please try again.',
      });
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg-secondary)]"
      // WCAG 2.4.2: page has a meaningful title (set via Helmet)
    >
      <div className="w-full max-w-md">
        {/* Dispensary branding */}
        {tenant?.brandingConfig?.logoUrl && (
          <img
            src={tenant.brandingConfig.logoUrl}
            alt={`${tenant.dispensaryName} logo`}
            className="mx-auto mb-8 h-12 object-contain"
          />
        )}

        <div
          className={[
            'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--p-shadow-lg)] p-8',
          ].join(' ')}
        >
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-2">
            Sign in
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Welcome back to {tenant?.dispensaryName ?? 'CannaSaas'}
          </p>

          {/* WCAG 4.1.3: Status messages — error is in a live region */}
          {errors.root && (
            <div
              role="alert"
              aria-live="assertive"
              className={[
                'flex items-start gap-3 p-4 mb-6 rounded-[var(--p-radius-md)]',
                'bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]',
                'text-[var(--color-error)] text-[var(--p-text-sm)]',
              ].join(' ')}
            >
              {errors.root.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate // We handle validation ourselves with Zod
            aria-label="Sign in form"
          >
            {/* Email field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
              >
                Email address
                <span
                  className="text-[var(--color-error)] ml-1"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                className={[
                  'w-full h-11 px-4 rounded-[var(--p-radius-md)]',
                  'bg-[var(--color-bg)] border text-[var(--color-text)]',
                  'text-[var(--p-text-base)] placeholder:text-[var(--color-text-disabled)]',
                  'transition-all duration-[var(--p-dur-fast)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                  errors.email
                    ? 'border-[var(--color-error)] bg-red-50/50 dark:bg-red-950/10'
                    : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                ].join(' ')}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field with show/hide toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
                >
                  Password
                  <span
                    className="text-[var(--color-error)] ml-1"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[var(--p-text-sm)] text-[var(--color-brand)] hover:underline focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  aria-invalid={!!errors.password}
                  className={[
                    'w-full h-11 pl-4 pr-12 rounded-[var(--p-radius-md)]',
                    'bg-[var(--color-bg)] border text-[var(--color-text)]',
                    'text-[var(--p-text-base)]',
                    'transition-all duration-[var(--p-dur-fast)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                    errors.password
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                  ].join(' ')}
                  {...register('password')}
                />
                {/* WCAG 2.5.3: show/hide label matches visual button label */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1 rounded"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending || isSubmitting}
              loadingText="Signing in..."
              leftIcon={<LogIn size={18} aria-hidden="true" />}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            New customer?{' '}
            <Link
              to="/auth/register"
              className="text-[var(--color-brand)] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
HEREDOC

# =============================================================================
# useAuth hook — required by LoginPage (useLogin import)
# packages/api-client/src/hooks/useAuth.ts
#
# The doc shows LoginPage importing useLogin from @cannasaas/api-client.
# The hook body is not re-printed in Part 5 (it was stubbed in Part 4).
# This is the full implementation needed for the storefront to compile.
# =============================================================================
section "+ useAuth hook (useLogin — required by LoginPage)"

write_file "${ROOT}/packages/api-client/src/hooks/useAuth.ts" <<'HEREDOC'
// packages/api-client/src/hooks/useAuth.ts
// Consumed by Part 5: LoginPage imports useLogin from '@cannasaas/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useAuthStore } from '@cannasaas/stores';
import type { User, LoginFormValues } from '@cannasaas/types';

// ── Login ─────────────────────────────────────────────────────────────────────
interface LoginResponse {
  accessToken: string;
  user: User;
}

/**
 * useLogin — Mutation that exchanges credentials for an access token.
 *
 * On success:
 *  - Populates authStore (user + accessToken)
 *  - The httpOnly refresh token cookie is set automatically by the API
 *
 * On failure:
 *  - Throws so LoginPage.onSubmit can catch and display a root form error
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials,
      );
      return data;
    },
    onSuccess: ({ user, accessToken }) => {
      useAuthStore.getState().setAuth(user, accessToken);
    },
  });
}

// ── Register ──────────────────────────────────────────────────────────────────
interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/register',
        payload,
      );
      return data;
    },
    onSuccess: ({ user, accessToken }) => {
      useAuthStore.getState().setAuth(user, accessToken);
    },
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Tell the API to invalidate the httpOnly refresh token cookie
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      // Always clear local state regardless of API response
      useAuthStore.getState().clearAuth();
      // Wipe all cached server data — prevents data leakage between sessions
      queryClient.clear();
    },
  });
}

// ── Current User (server-side re-validation) ──────────────────────────────────
export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: User }>('/auth/me');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // On success keep the store in sync if profile data changed server-side
    select: (user) => {
      useAuthStore.getState().updateUser(user);
      return user;
    },
  });
}
HEREDOC

# ── Update api-client index.ts to export the real useAuth hooks ───────────────
# Read the current index, check whether the auth exports are still commented,
# and activate them.  We do a targeted replacement so other stub-comments
# that belong to later parts remain untouched.
INDEX_FILE="${ROOT}/packages/api-client/src/index.ts"

if [[ -f "${INDEX_FILE}" ]]; then
  # Uncomment the useAuth export line if it is still commented out
  sed -i.bak \
    "s|// export { useLogin, useRegister, useLogout } from './hooks/useAuth';|export { useLogin, useRegister, useLogout, useCurrentUserQuery } from './hooks/useAuth';|" \
    "${INDEX_FILE}"
  rm -f "${INDEX_FILE}.bak"
  ok "Updated $INDEX_FILE — useAuth exports activated"
else
  warn "$INDEX_FILE not found — writing fresh index with all known exports"
  write_file "${INDEX_FILE}" <<'HEREDOC'
// ── API Client — Public Surface ───────────────────────────────────────────────
export { apiClient, createApiClient } from './client';

// Part 4
export {
  productKeys,
  useProducts,
  useInfiniteProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useLowStockProducts,
  type ProductFilters,
} from './hooks/useProducts';

// Part 5
export {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUserQuery,
} from './hooks/useAuth';

// Parts 6–7 (stubs — uncomment as implemented)
// export { useOrders, useOrder, useUpdateOrderStatus } from './hooks/useOrders';
// export { useCart, useAddToCart } from './hooks/useCart';
// export { useAnalyticsDashboard } from './hooks/useAnalytics';
// export { useComplianceLogs, usePurchaseLimitCheck } from './hooks/useCompliance';
// export { useSearchSuggestions, useSearchProducts } from './hooks/useSearch';
// export { useWebSocketEvent } from './hooks/useWebSocketEvent';

export { wsManager } from './services/WebSocketManager';
HEREDOC
fi

# =============================================================================
# SUMMARY
# =============================================================================
print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  Part 5 complete!                             ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f"
print ""
print -P "  %F{cyan}Files written:%f"
print ""
print -P "  %F{white}apps/storefront%f"
print -P "    src/providers/TenantProvider.tsx"
print -P "      Resolves dispensary from hostname → populates organizationStore"
print -P "      Dev fallback reads VITE_DEFAULT_ORG_ID / VITE_DEFAULT_DISPENSARY_ID"
print ""
print -P "    src/components/ProtectedRoute.tsx"
print -P "      Guards auth-only pages, role-checks, sessionStorage hydration spinner"
print ""
print -P "    src/pages/Auth/LoginPage.tsx"
print -P "      RHF + Zod, show/hide password, WCAG live-region errors,"
print -P "      post-login redirect to original destination"
print ""
print -P "  %F{white}packages/api-client%f"
print -P "    src/hooks/useAuth.ts"
print -P "      useLogin  — credentials → access token → authStore"
print -P "      useRegister, useLogout, useCurrentUserQuery"
print -P "    src/index.ts  — useAuth exports activated"
print ""
print -P "  %F{yellow}Next step:%f  run Part 6 scaffold → Design System & Theming Engine"
print ""

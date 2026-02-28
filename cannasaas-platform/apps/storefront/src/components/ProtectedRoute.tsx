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

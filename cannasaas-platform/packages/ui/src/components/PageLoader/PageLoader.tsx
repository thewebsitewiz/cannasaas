// packages/ui/src/components/PageLoader/PageLoader.tsx
// Suspense fallback alias for FullPageLoader
import React from 'react';
import { FullPageLoader } from '../FullPageLoader/FullPageLoader';
interface PageLoaderProps { message?: string; }
export function PageLoader({ message = 'Loading…' }: PageLoaderProps) {
  return <FullPageLoader message={message} />;
}

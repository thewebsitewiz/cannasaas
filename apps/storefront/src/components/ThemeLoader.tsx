'use client';

import { useEffect, useState } from 'react';

// ── Valid design system files (whitelist for security) ─────────────────
const ALLOWED_FILES = new Set([
  'casual.css',
  'spring-bloom.css',
  // Add new design system files here as they're created
]);

const DS_LINK_ID = 'design-system-css';
const FALLBACK_FILE = 'casual.css';

interface DesignSystemConfig {
  designSystem: string;
  designSystemFile: string;
}

interface ThemeLoaderProps {
  /** The dispensary ID for this storefront tenant */
  dispensaryId: string;
  /** GraphQL endpoint URL (defaults to /api/graphql) */
  graphqlUrl?: string;
  /** Optional fallback CSS file if the API call fails */
  fallback?: string;
}

/**
 * ThemeLoader — fetches the dispensary's active design system
 * from the API and injects the corresponding CSS file into <head>.
 *
 * Place this once in your root layout:
 *
 *   <ThemeLoader dispensaryId={tenant.entity_id} />
 *
 * The CSS file must exist in /public/styles/{file}.
 * Deploy with: bash deploy-design-system.sh
 */
export function ThemeLoader({
  dispensaryId,
  graphqlUrl = '/api/graphql',
  fallback = FALLBACK_FILE,
}: ThemeLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dispensaryId) return;

    let cancelled = false;

    async function loadDesignSystem() {
      let file = fallback;

      try {
        const res = await fetch(graphqlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query ($id: ID!) {
              designSystemConfig(dispensaryId: $id) {
                designSystem
                designSystemFile
              }
            }`,
            variables: { id: dispensaryId },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const config: DesignSystemConfig | undefined =
            json?.data?.designSystemConfig;

          if (config?.designSystemFile && ALLOWED_FILES.has(config.designSystemFile)) {
            file = config.designSystemFile;
          }
        }
      } catch {
        // API unavailable — use fallback
      }

      if (cancelled) return;

      // Inject or update the <link> tag
      let link = document.getElementById(DS_LINK_ID) as HTMLLinkElement | null;

      if (!link) {
        link = document.createElement('link');
        link.id = DS_LINK_ID;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      link.href = `/styles/${file}`;
      setLoaded(true);
    }

    loadDesignSystem();

    return () => {
      cancelled = true;
    };
  }, [dispensaryId, graphqlUrl, fallback]);

  // Render nothing — this is a side-effect-only component
  return null;
}

import { Check, Loader2, Palette } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';

// ═══════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM REGISTRY
// ─────────────────────────────────────────────────────────────────────
// To add a new design system:
//   1. Create your CSS file (e.g. midnight-haze.css)
//   2. Add an entry to DESIGN_SYSTEMS below
//   3. Place the CSS in each app's public/styles/ directory
//   4. Run: bash deploy-design-system.sh midnight-haze.css
// ═══════════════════════════════════════════════════════════════════════

export interface DesignSystem {
  /** URL-safe slug, stored in DB */
  id: string;
  /** Display name */
  name: string;
  /** CSS filename served from /styles/ */
  file: string;
  /** Short description */
  description: string;
  /** CSS gradient for the preview card header */
  gradient: string;
  /** 4 hex colors shown as swatch dots */
  swatches: string[];
  /** Tags shown below description */
  tags: { label: string; color: string }[];
  /** Tailwind color class for the filename badge */
  badgeColor: string;
}

export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'casual',
    name: 'Casual',
    file: 'casual.css',
    description: 'System fonts · Tailwind green palette · Minimal styling',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    swatches: ['#22c55e', '#16a34a', '#15803d', '#166534'],
    tags: [
      { label: 'system-ui', color: 'bg-gray-100 text-gray-600' },
      { label: 'green-600', color: 'bg-gray-100 text-gray-600' },
    ],
    badgeColor: 'bg-gray-100 text-gray-500',
  },
  {
    id: 'spring-bloom',
    name: 'Spring Bloom',
    file: 'spring-bloom.css',
    description:
      'Sora + Nunito Sans · Meadow / Wisteria / Poppy · Animations & dark mode',
    gradient:
      'linear-gradient(135deg, #F2F9EE 0%, #E0F1D5 30%, #F0EAFD 60%, #FFF6F0 100%)',
    swatches: ['#56A638', '#3F852A', '#9B72E8', '#FF6B25'],
    tags: [
      { label: 'Sora', color: 'bg-green-50 text-green-700' },
      { label: 'brand', color: 'bg-green-50 text-green-700' },
      { label: 'secondary', color: 'bg-purple-50 text-purple-700' },
      { label: 'accent', color: 'bg-orange-50 text-orange-700' },
    ],
    badgeColor: 'bg-green-50 text-green-700',
  },
  // ── Add more here ──────────────────────────────────────────────────
  // {
  //   id: 'midnight-haze',
  //   name: 'Midnight Haze',
  //   file: 'midnight-haze.css',
  //   description: 'Dark mode first · Neon accents · Mono typography',
  //   gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
  //   swatches: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca'],
  //   tags: [
  //     { label: 'JetBrains', color: 'bg-indigo-50 text-indigo-700' },
  //     { label: 'indigo',    color: 'bg-indigo-50 text-indigo-700' },
  //   ],
  //   badgeColor: 'bg-indigo-50 text-indigo-700',
  // },
];

/* ── GraphQL ──────────────────────────────────────────────────────────── */

const GET_DESIGN_SYSTEM = `
  query ($id: ID!) {
    designSystemConfig(dispensaryId: $id) {
      designSystem
      designSystemFile
    }
  }
`;

const SET_DESIGN_SYSTEM = `
  mutation ($id: ID!, $designSystem: String!, $designSystemFile: String!) {
    setDesignSystem(
      dispensaryId: $id
      designSystem: $designSystem
      designSystemFile: $designSystemFile
    ) {
      designSystem
      designSystemFile
    }
  }
`;

/* ── Runtime CSS loader ───────────────────────────────────────────────── */

const DS_LINK_ID = 'design-system-css';

function loadDesignSystemCSS(file: string) {
  let link = document.getElementById(DS_LINK_ID) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.id = DS_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  link.href = `/styles/${file}`;
}

function getCurrentFile(): string | null {
  const link = document.getElementById(DS_LINK_ID) as HTMLLinkElement | null;
  return link?.href?.split('/styles/').pop() ?? null;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function DesignSystemPicker() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();

  // Fetch persisted design system from API
  const { data: persisted } = useQuery({
    queryKey: ['designSystem', dispensaryId],
    queryFn: () =>
      gqlRequest<{ designSystemConfig: { designSystem: string; designSystemFile: string } }>(
        GET_DESIGN_SYSTEM,
        { id: dispensaryId }
      ),
    select: (d) => d.designSystemConfig?.designSystem,
    enabled: !!dispensaryId,
    retry: false,
  });

  // Resolve active: API value > localStorage fallback > first in registry
  const activeId = useMemo(() => {
    if (persisted && DESIGN_SYSTEMS.some((ds) => ds.id === persisted)) {
      return persisted;
    }
    const stored = localStorage.getItem('cannasaas:designSystem');
    if (stored && DESIGN_SYSTEMS.some((ds) => ds.id === stored)) {
      return stored;
    }
    return DESIGN_SYSTEMS[0].id;
  }, [persisted]);

  const [selectedId, setSelectedId] = useState(activeId);
  const [justApplied, setJustApplied] = useState(false);

  // Sync selection when API data arrives
  useEffect(() => {
    setSelectedId(activeId);
  }, [activeId]);

  // Load the CSS on mount
  useEffect(() => {
    const ds = DESIGN_SYSTEMS.find((d) => d.id === activeId);
    if (ds) loadDesignSystemCSS(ds.file);
  }, [activeId]);

  const isPending = selectedId !== activeId;
  const selectedDS = DESIGN_SYSTEMS.find((d) => d.id === selectedId);

  // Persist to API
  const mutation = useMutation({
    mutationFn: () => {
      const ds = DESIGN_SYSTEMS.find((d) => d.id === selectedId);
      if (!ds) throw new Error('Unknown design system');
      return gqlRequest(SET_DESIGN_SYSTEM, {
        id: dispensaryId,
        designSystem: ds.id,
        designSystemFile: ds.file,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designSystem'] });
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 3000);
    },
    onError: () => {
      // API field may not exist yet — persist to localStorage as fallback
      const ds = DESIGN_SYSTEMS.find((d) => d.id === selectedId);
      if (ds) {
        localStorage.setItem('cannasaas:designSystem', ds.id);
        loadDesignSystemCSS(ds.file);
        setJustApplied(true);
        setTimeout(() => setJustApplied(false), 3000);
      }
    },
  });

  const handleApply = useCallback(() => {
    const ds = DESIGN_SYSTEMS.find((d) => d.id === selectedId);
    if (!ds) return;

    // Immediately swap CSS for instant feedback
    loadDesignSystemCSS(ds.file);
    localStorage.setItem('cannasaas:designSystem', ds.id);

    // Persist to API
    mutation.mutate();
  }, [selectedId, mutation]);

  return (
    <div className="bg-surface rounded-xl border border-bdr p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-brand-50 rounded-lg">
          <Palette size={18} className="text-brand-500" />
        </div>
        <h2 className="text-lg font-semibold text-txt">Design System</h2>

        {isPending ? (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
            Pending: {selectedDS?.name}
          </span>
        ) : (
          <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full font-medium">
            Active: {selectedDS?.name}
          </span>
        )}

        <span className="text-xs bg-gray-100 text-txt-muted px-2.5 py-0.5 rounded-full font-medium">
          {DESIGN_SYSTEMS.length} available
        </span>
      </div>

      <p className="text-sm text-txt-secondary mb-5">
        Choose the base CSS design system for your storefront. This controls
        fonts, colors, spacing, shadows, and component styles across all pages.
      </p>

      {/* ── Cards ────────────────────────────────────────────────────── */}
      <div
        className={`grid gap-4 ${
          DESIGN_SYSTEMS.length >= 3
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {DESIGN_SYSTEMS.map((ds) => {
          const isSelected = ds.id === selectedId;
          const isActive = ds.id === activeId;

          return (
            <button
              key={ds.id}
              onClick={() => setSelectedId(ds.id)}
              className={`rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-200'
                  : 'border-bdr hover:border-brand-300'
              }`}
            >
              {/* Gradient header with swatches */}
              <div
                className="aspect-[3/1] p-4 flex items-end relative"
                style={{ background: ds.gradient }}
              >
                <div className="flex gap-1.5">
                  {ds.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {isActive && (
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-gray-700 font-semibold shadow-sm">
                    ● Active
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-surface border-t border-bdr">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-txt">{ds.name}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-mono ${ds.badgeColor}`}
                  >
                    {ds.file}
                  </span>
                </div>
                <p className="text-xs text-txt-muted">{ds.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ds.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${tag.color}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Apply bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-bdr">
        <p className="text-xs text-txt-muted">
          CSS loads at runtime via{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            ThemeLoader
          </code>
          . Path:{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            /styles/{selectedDS?.file}
          </code>
        </p>

        <button
          onClick={handleApply}
          disabled={!isPending || mutation.isPending}
          className={`flex items-center gap-2 text-sm px-5 py-2 rounded-lg font-semibold transition-all ${
            isPending
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-brand-100 text-brand-700 cursor-default'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Applying…
            </>
          ) : justApplied ? (
            <>
              <Check size={14} /> Applied ✓
            </>
          ) : isPending ? (
            <>Apply {selectedDS?.name}</>
          ) : (
            <>
              <Check size={14} /> Applied ✓
            </>
          )}
        </button>
      </div>
    </div>
  );
}

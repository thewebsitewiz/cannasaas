import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Eye, EyeOff, Save, RotateCcw, Loader2 } from 'lucide-react';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';

// ── GraphQL ──────────────────────────────────────────────────

const GET_TYPES = `query($dispensaryId: ID!) {
  dispensaryProductTypes(dispensaryId: $dispensaryId) {
    productTypeId code name isEnabled sortOrder
  }
}`;

const SAVE_TYPES = `mutation($dispensaryId: ID!, $types: [DispensaryProductTypeInput!]!) {
  saveDispensaryProductTypes(dispensaryId: $dispensaryId, types: $types) {
    productTypeId code name isEnabled sortOrder
  }
}`;

// ── Types ────────────────────────────────────────────────────

interface ProductTypeConfig {
  productTypeId: number;
  code: string;
  name: string;
  isEnabled: boolean;
  sortOrder: number;
}

// ── Component ────────────────────────────────────────────────

export function MenuCategoriesPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();

  const [items, setItems] = useState<ProductTypeConfig[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['dispensaryProductTypes', dispensaryId],
    queryFn: () =>
      gqlRequest<{ dispensaryProductTypes: ProductTypeConfig[] }>(GET_TYPES, { dispensaryId }),
    select: (d) => d.dispensaryProductTypes,
    enabled: !!dispensaryId,
  });

  useEffect(() => {
    if (data) {
      setItems([...data].sort((a, b) => a.sortOrder - b.sortOrder));
      setDirty(false);
    }
  }, [data]);

  // ── Save ───────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () =>
      gqlRequest(SAVE_TYPES, {
        dispensaryId,
        types: items.map((t, i) => ({
          productTypeId: t.productTypeId,
          isEnabled: t.isEnabled,
          sortOrder: i,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispensaryProductTypes'] });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // ── Toggle ─────────────────────────────────────────────────

  const toggle = useCallback((idx: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, isEnabled: !item.isEnabled } : item,
      ),
    );
    setDirty(true);
  }, []);

  // ── Drag handlers ──────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    const from = dragIdx.current;
    if (from === null || from === idx) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }

    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(idx, 0, moved);
      return copy;
    });
    setDirty(true);
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  // ── Reset ──────────────────────────────────────────────────

  const reset = () => {
    if (data) {
      setItems([...data].sort((a, b) => a.sortOrder - b.sortOrder));
      setDirty(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-txt-muted py-12">
        <Loader2 size={18} className="animate-spin" /> Loading menu categories...
      </div>
    );
  }

  const enabledCount = items.filter((t) => t.isEnabled).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-txt">Menu Categories</h1>
        <p className="text-sm text-txt-muted mt-1">
          Choose which product types appear on your storefront menu and set their display order.
          Drag to reorder, toggle to show or hide.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-txt-secondary">
          <strong className="text-txt">{enabledCount}</strong> of {items.length} categories visible
        </span>
        {dirty && (
          <span className="text-warning font-medium">Unsaved changes</span>
        )}
        {saved && (
          <span className="text-success font-medium">Saved!</span>
        )}
      </div>

      {/* Sortable list */}
      <div className="bg-surface rounded-xl border border-bdr overflow-hidden">
        {items.map((item, idx) => (
          <div
            key={item.productTypeId}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={[
              'flex items-center gap-3 px-4 py-3 transition-all',
              'border-b border-bdr last:border-b-0',
              dragOverIdx === idx ? 'bg-brand-50 border-brand-300' : '',
              !item.isEnabled ? 'opacity-50' : '',
            ].join(' ')}
          >
            {/* Drag handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-txt-faint hover:text-txt-muted p-1"
              aria-label={`Drag to reorder ${item.name}`}
            >
              <GripVertical size={16} />
            </div>

            {/* Sort number */}
            <span className="w-6 text-center text-xs font-mono text-txt-faint">
              {idx + 1}
            </span>

            {/* Name */}
            <span className={`flex-1 text-sm font-medium ${item.isEnabled ? 'text-txt' : 'text-txt-muted line-through'}`}>
              {item.name}
            </span>

            {/* Code badge */}
            <span className="text-[10px] font-mono text-txt-faint bg-bg-alt px-2 py-0.5 rounded">
              {item.code}
            </span>

            {/* Toggle */}
            <button
              onClick={() => toggle(idx)}
              aria-label={`${item.isEnabled ? 'Hide' : 'Show'} ${item.name}`}
              className={[
                'p-2 rounded-lg transition-colors',
                item.isEnabled
                  ? 'text-success hover:bg-success-bg'
                  : 'text-txt-faint hover:bg-bg-alt',
              ].join(' ')}
            >
              {item.isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => mutation.mutate()}
          disabled={!dirty || mutation.isPending}
          className="flex items-center gap-2 bg-brand-600 text-txt-inverse font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> Save Order</>
          )}
        </button>

        {dirty && (
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-txt-muted hover:text-txt transition-colors px-4 py-2.5"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Help text */}
      <div className="mt-8 text-xs text-txt-faint space-y-1">
        <p>Customers will see only enabled categories on the storefront menu, in the order shown above.</p>
        <p>Disabling a category hides it from the menu but does not affect existing products or inventory.</p>
      </div>
    </div>
  );
}

export default MenuCategoriesPage;

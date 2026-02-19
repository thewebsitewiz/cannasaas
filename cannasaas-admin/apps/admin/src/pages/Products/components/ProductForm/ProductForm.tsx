/**
 * @file ProductForm.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/ProductForm.tsx
 *
 * Full product create/edit form. Aggregates all six form sections into a
 * tabbed layout with react-hook-form validation.
 *
 * TABS: Basic Info | Cannabis Info | Variants | Media | SEO | Compliance
 * Each tab is a panel; the tab bar uses ARIA Tabs pattern
 * (role="tablist", role="tab", role="tabpanel", aria-selected, aria-controls).
 *
 * VALIDATION: All validation rules live in section components. On submit,
 * react-hook-form runs all rules; tabs with errors display an error indicator
 * dot so the user knows which tab needs attention.
 *
 * PATTERN:
 *   - useForm at this level; register/control/errors passed down to sections.
 *   - Form state is the single source of truth; sections are stateless.
 *   - defaultValues populated from `product` prop in edit mode.
 */

import React, { useId, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { CannabisInfoSection } from './sections/CannabisInfoSection';
import { VariantsSection } from './sections/VariantsSection';
import { MediaSection } from './sections/MediaSection';
import { SeoSection } from './sections/SeoSection';
import { ComplianceSection } from './sections/ComplianceSection';
import type { Product, ProductFormValues } from '../../../../types/admin.types';
import styles from './ProductForm.module.css';

// ─── Tabs Definition ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'basic',      label: 'Basic Info' },
  { key: 'cannabis',   label: 'Cannabis Info' },
  { key: 'variants',   label: 'Variants' },
  { key: 'media',      label: 'Media' },
  { key: 'seo',        label: 'SEO' },
  { key: 'compliance', label: 'Compliance' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductFormProps {
  /** Existing product for edit mode. Omit for create mode. */
  product?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductForm({ product, onSubmit, onCancel, isSubmitting = false }: ProductFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const uid = useId();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          category: product.category,
          status: product.status,
          strainType: product.strainType,
          thcPct: product.thcPct ?? undefined,
          cbdPct: product.cbdPct ?? undefined,
          terpenes: product.terpenes,
          effects: product.effects,
          flavors: product.flavors,
          variants: product.variants,
          primaryImageId: product.primaryImageId ?? undefined,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          keywords: product.keywords,
          metrcId: product.metrcId ?? undefined,
          batchNumber: product.batchNumber ?? undefined,
          harvestDate: product.harvestDate ?? undefined,
          expirationDate: product.expirationDate ?? undefined,
          imageFiles: [],
        }
      : {
          terpenes: [],
          effects: [],
          flavors: [],
          variants: [],
          keywords: [],
          imageFiles: [],
          status: 'draft',
          strainType: 'unknown',
        },
  });

  const productName = watch('name', '');

  // Tab error indicator: check if any error keys belong to a given tab's fields
  const TAB_FIELDS: Record<TabKey, string[]> = {
    basic:      ['name', 'slug', 'shortDescription', 'longDescription', 'category'],
    cannabis:   ['strainType', 'thcPct', 'cbdPct'],
    variants:   ['variants'],
    media:      ['imageFiles'],
    seo:        ['metaTitle', 'metaDescription', 'keywords'],
    compliance: ['metrcId', 'batchNumber', 'harvestDate', 'expirationDate'],
  };

  const tabHasError = useCallback((tabKey: TabKey) => {
    return TAB_FIELDS[tabKey].some((field) => field in errors);
  }, [errors]);

  const handleTabKeyDown = (e: React.KeyboardEvent, tabKey: TabKey) => {
    const currentIndex = TABS.findIndex((t) => t.key === tabKey);
    if (e.key === 'ArrowRight') {
      const next = TABS[(currentIndex + 1) % TABS.length];
      setActiveTab(next.key);
      document.getElementById(`${uid}-tab-${next.key}`)?.focus();
    }
    if (e.key === 'ArrowLeft') {
      const prev = TABS[(currentIndex - 1 + TABS.length) % TABS.length];
      setActiveTab(prev.key);
      document.getElementById(`${uid}-tab-${prev.key}`)?.focus();
    }
    if (e.key === 'Home') {
      setActiveTab(TABS[0].key);
      document.getElementById(`${uid}-tab-${TABS[0].key}`)?.focus();
    }
    if (e.key === 'End') {
      const last = TABS[TABS.length - 1];
      setActiveTab(last.key);
      document.getElementById(`${uid}-tab-${last.key}`)?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={product ? `Edit ${product.name}` : 'Create new product'}
      className={styles.form}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Product form sections"
        className={styles.tabList}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasError = tabHasError(tab.key);
          return (
            <button
              key={tab.key}
              id={`${uid}-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${hasError ? styles.tabError : ''}`}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.key)}
            >
              {tab.label}
              {hasError && (
                <span className={styles.errorDot} aria-label="Has errors" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ──────────────────────────────────────────── */}
      <div className={styles.panelWrapper}>
        {/* Basic Info Panel */}
        <div
          id={`${uid}-panel-basic`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-basic`}
          hidden={activeTab !== 'basic'}
          className={styles.panel}
        >
          <BasicInfoSection
            register={register}
            control={control}
            errors={errors}
            productName={productName}
          />
        </div>

        {/* Cannabis Info Panel */}
        <div
          id={`${uid}-panel-cannabis`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-cannabis`}
          hidden={activeTab !== 'cannabis'}
          className={styles.panel}
        >
          <CannabisInfoSection register={register} control={control} errors={errors} />
        </div>

        {/* Variants Panel */}
        <div
          id={`${uid}-panel-variants`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-variants`}
          hidden={activeTab !== 'variants'}
          className={styles.panel}
        >
          <VariantsSection register={register} control={control} errors={errors} />
        </div>

        {/* Media Panel */}
        <div
          id={`${uid}-panel-media`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-media`}
          hidden={activeTab !== 'media'}
          className={styles.panel}
        >
          <MediaSection
            control={control}
            existingImages={product?.images}
            primaryImageId={product?.primaryImageId}
          />
        </div>

        {/* SEO Panel */}
        <div
          id={`${uid}-panel-seo`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-seo`}
          hidden={activeTab !== 'seo'}
          className={styles.panel}
        >
          <SeoSection
            register={register}
            control={control}
            errors={errors}
            productName={productName}
          />
        </div>

        {/* Compliance Panel */}
        <div
          id={`${uid}-panel-compliance`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-compliance`}
          hidden={activeTab !== 'compliance'}
          className={styles.panel}
        >
          <ComplianceSection register={register} errors={errors} />
        </div>
      </div>

      {/* ── Form Actions ────────────────────────────────────────── */}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <><span className={styles.btnSpinner} aria-hidden="true" /> Saving…</>
          ) : (
            product ? 'Save Changes' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
}


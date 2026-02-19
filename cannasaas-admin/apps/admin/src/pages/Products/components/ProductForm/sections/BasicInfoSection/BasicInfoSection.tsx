/**
 * @file BasicInfoSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.tsx
 *
 * Basic product information form section: name, slug, short + long descriptions.
 * Includes an AI generation button that calls the Sprint 9 AI endpoint to
 * draft a product description based on name + cannabis metadata.
 *
 * PATTERN: This section receives the react-hook-form `control` and `register`
 * props from the parent ProductForm rather than managing its own form state.
 * This keeps all form validation and submission in one place.
 *
 * WCAG: All inputs use FormField wrapper for accessible label + error wiring.
 * The AI generate button has aria-busy while the request is in-flight.
 */

import React, { useState } from 'react';
import { UseFormRegister, Control, useController, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './BasicInfoSection.module.css';

// ─── Slug Generator ───────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BasicInfoSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  /** Product name — used when calling the AI generation endpoint */
  productName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BasicInfoSection({
  register,
  control,
  errors,
  productName,
}: BasicInfoSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Controlled slug field so we can auto-update it from the name
  const { field: slugField } = useController({
    name: 'slug',
    control,
    rules: {
      required: 'Slug is required',
      pattern: { value: /^[a-z0-9-]+$/, message: 'Slug must be lowercase letters, numbers, and hyphens only' },
    },
  });

  // Controlled longDescription so AI can set it
  const { field: longDescField } = useController({
    name: 'longDescription',
    control,
    rules: { required: 'Long description is required' },
  });

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-generate slug from name if slug is still empty
    if (!slugField.value && e.target.value) {
      slugField.onChange(generateSlug(e.target.value));
    }
  };

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
      });
      if (res.ok) {
        const { description } = await res.json();
        longDescField.onChange(description);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Basic Information</legend>

      <div className={styles.grid}>
        {/* Product Name */}
        <FormField
          label="Product Name"
          required
          error={errors.name?.message}
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('name', { required: 'Product name is required' })}
              className={styles.input}
              type="text"
              placeholder="e.g. Blue Dream Pre-Roll"
              onBlur={handleNameBlur}
              autoComplete="off"
            />
          )}
        </FormField>

        {/* Slug */}
        <FormField
          label="URL Slug"
          required
          hint="Used in the product URL. Auto-generated from name."
          error={errors.slug?.message}
        >
          {({ id, inputProps }) => (
            <div className={styles.slugWrapper}>
              <span className={styles.slugPrefix} aria-hidden="true">/shop/</span>
              <input
                id={id}
                {...inputProps}
                {...slugField}
                className={`${styles.input} ${styles.slugInput}`}
                type="text"
                placeholder="blue-dream-pre-roll"
                autoComplete="off"
              />
            </div>
          )}
        </FormField>

        {/* Category */}
        <FormField label="Category" required error={errors.category?.message}>
          {({ id, inputProps }) => (
            <select
              id={id}
              {...inputProps}
              {...register('category', { required: 'Category is required' })}
              className={styles.select}
            >
              <option value="">Select a category…</option>
              <option value="flower">Flower</option>
              <option value="edibles">Edibles</option>
              <option value="concentrates">Concentrates</option>
              <option value="vapes">Vapes</option>
              <option value="topicals">Topicals</option>
              <option value="tinctures">Tinctures</option>
              <option value="pre_rolls">Pre-Rolls</option>
              <option value="accessories">Accessories</option>
            </select>
          )}
        </FormField>

        {/* Short Description */}
        <FormField
          label="Short Description"
          required
          hint="Shown in product cards and search results. Max 160 characters."
          error={errors.shortDescription?.message}
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <textarea
              id={id}
              {...inputProps}
              {...register('shortDescription', {
                required: 'Short description is required',
                maxLength: { value: 160, message: 'Maximum 160 characters' },
              })}
              className={`${styles.input} ${styles.textarea}`}
              rows={2}
              placeholder="A brief, enticing product description…"
            />
          )}
        </FormField>

        {/* Long Description */}
        <div className={styles.fullWidth}>
          <div className={styles.longDescHeader}>
            <FormField
              label="Long Description"
              required
              error={errors.longDescription?.message}
              className={styles.longDescField}
            >
              {({ id, inputProps }) => (
                <textarea
                  id={id}
                  {...inputProps}
                  {...longDescField}
                  className={`${styles.input} ${styles.textarea} ${styles.textareaLarge}`}
                  rows={6}
                  placeholder="Detailed product description with effects, flavor notes, and usage guidance…"
                />
              )}
            </FormField>
            <button
              type="button"
              className={styles.aiBtn}
              onClick={handleGenerateDescription}
              disabled={isGenerating || !productName}
              aria-busy={isGenerating}
              aria-label={isGenerating ? 'Generating description…' : 'Generate description with AI'}
              title={!productName ? 'Enter a product name first' : undefined}
            >
              {isGenerating ? (
                <span className={styles.aiSpinner} aria-hidden="true" />
              ) : (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              )}
              {isGenerating ? 'Generating…' : 'AI Generate'}
            </button>
          </div>
        </div>
      </div>
    </fieldset>
  );
}


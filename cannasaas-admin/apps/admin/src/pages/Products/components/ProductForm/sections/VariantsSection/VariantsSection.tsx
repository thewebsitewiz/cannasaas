/**
 * @file VariantsSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.tsx
 *
 * Dynamic product variant manager using react-hook-form's useFieldArray.
 * Each variant has: label (e.g. "3.5g"), SKU, base/sale/cost/MSRP pricing,
 * stock quantity, and an active toggle.
 *
 * PATTERN: useFieldArray gives each variant a stable `id` key so React
 * can reconcile the list correctly when rows are reordered or removed.
 *
 * WCAG:
 *   • Each variant row is a <fieldset> with a <legend> showing the variant index.
 *   • Remove buttons have aria-label="Remove variant N".
 *   • An aria-live region announces when variants are added or removed.
 *   • Price fields use inputmode="decimal" for mobile numeric keyboard.
 */

import React from 'react';
import { UseFormRegister, Control, FieldErrors, useFieldArray } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './VariantsSection.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface VariantsSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VariantsSection({ register, control, errors }: VariantsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const addVariant = () => {
    append({
      id: '',
      label: '',
      sku: '',
      priceCents: 0,
      salePriceCents: null,
      costCents: null,
      msrpCents: null,
      stock: 0,
      isActive: true,
    });
  };

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Variants &amp; Pricing</legend>

      {/* Live region announces variant count changes */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {fields.length} variant{fields.length !== 1 ? 's' : ''}
      </div>

      <div className={styles.variantList}>
        {fields.length === 0 && (
          <p className={styles.emptyHint}>
            No variants yet. Add at least one variant to set pricing and stock.
          </p>
        )}

        {fields.map((field, index) => {
          const variantErrors = errors.variants?.[index];
          return (
            <fieldset key={field.id} className={styles.variantRow}>
              <legend className={styles.variantLegend}>
                Variant {index + 1}
              </legend>

              <div className={styles.variantGrid}>
                {/* Label */}
                <FormField
                  label="Label"
                  required
                  hint='e.g. "3.5g", "1oz", "10mg"'
                  error={variantErrors?.label?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.label`, { required: 'Label is required' })}
                      className={styles.input}
                      type="text"
                      placeholder="3.5g"
                    />
                  )}
                </FormField>

                {/* SKU */}
                <FormField
                  label="SKU"
                  required
                  error={variantErrors?.sku?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.sku`, { required: 'SKU is required' })}
                      className={styles.input}
                      type="text"
                      placeholder="PROD-001-3.5G"
                    />
                  )}
                </FormField>

                {/* Base Price */}
                <FormField
                  label="Price ($)"
                  required
                  error={variantErrors?.priceCents?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.priceCents`, {
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be ≥ 0' },
                        valueAsNumber: true,
                      })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Sale Price */}
                <FormField label="Sale Price ($)" hint="Optional">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.salePriceCents`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Must be ≥ 0' },
                      })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Cost */}
                <FormField label="Cost ($)" hint="Internal use only">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.costCents`, { valueAsNumber: true })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* MSRP */}
                <FormField label="MSRP ($)" hint="Manufacturer suggested">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.msrpCents`, { valueAsNumber: true })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Stock */}
                <FormField
                  label="Stock Qty"
                  required
                  error={variantErrors?.stock?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.stock`, {
                        required: 'Stock is required',
                        min: { value: 0, message: 'Must be ≥ 0' },
                        valueAsNumber: true,
                      })}
                      className={styles.input}
                      type="number"
                      min="0"
                      placeholder="0"
                      inputMode="numeric"
                    />
                  )}
                </FormField>

                {/* Active toggle */}
                <div className={styles.activeToggle}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      {...register(`variants.${index}.isActive`)}
                    />
                    <span className={styles.toggleTrack} aria-hidden="true" />
                    Active
                  </label>
                </div>
              </div>

              {/* Remove variant */}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(index)}
                aria-label={`Remove variant ${index + 1}`}
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Remove
              </button>
            </fieldset>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.addBtn}
        onClick={addVariant}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Variant
      </button>
    </fieldset>
  );
}


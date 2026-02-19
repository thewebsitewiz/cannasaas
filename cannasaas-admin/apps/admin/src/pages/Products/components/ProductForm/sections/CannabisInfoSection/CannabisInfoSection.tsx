/**
 * @file CannabisInfoSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.tsx
 *
 * Cannabis-specific product metadata form section.
 * Includes: strain type selector, THC/CBD percentage inputs,
 * terpene multi-select, and tag inputs for effects and flavors.
 *
 * TAG INPUT PATTERN: Effects and flavors use a controlled tag input
 * that renders chips. Tags are added on Enter/comma and removed by
 * clicking the chip's remove button or backspace when the input is empty.
 *
 * WCAG: Tag chips have role="listitem"; the remove button for each has
 * aria-label="Remove [tag name]". The input announces the tag count
 * via an aria-live region.
 */

import React, { KeyboardEvent, useState } from 'react';
import { UseFormRegister, Controller, Control, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './CannabisInfoSection.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_TERPENES = [
  'Myrcene', 'Limonene', 'Caryophyllene', 'Linalool', 'Pinene',
  'Terpinolene', 'Ocimene', 'Humulene', 'Bisabolol', 'Valencene',
];

// ─── TagInput Sub-Component ───────────────────────────────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id: string;
  ariaProps: Record<string, unknown>;
}

function TagInput({ value, onChange, placeholder, id, ariaProps }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={styles.tagInputWrapper} role="group">
      {/* Existing tags */}
      {value.length > 0 && (
        <ul className={styles.tagList} role="list" aria-label="Selected tags">
          {value.map((tag) => (
            <li key={tag} role="listitem" className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* New tag input */}
      <input
        id={id}
        {...ariaProps}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={value.length === 0 ? placeholder : 'Add more…'}
        className={styles.tagTextInput}
        aria-label={placeholder}
      />

      {/* Live region for screen reader tag count */}
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {value.length > 0 ? `${value.length} tag${value.length !== 1 ? 's' : ''} selected` : ''}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CannabisInfoSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CannabisInfoSection({ register, control, errors }: CannabisInfoSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Cannabis Information</legend>

      <div className={styles.grid}>
        {/* Strain Type */}
        <FormField label="Strain Type" required error={errors.strainType?.message}>
          {({ id, inputProps }) => (
            <select
              id={id}
              {...inputProps}
              {...register('strainType', { required: 'Strain type is required' })}
              className={styles.select}
            >
              <option value="">Select strain type…</option>
              <option value="indica">Indica</option>
              <option value="sativa">Sativa</option>
              <option value="hybrid">Hybrid</option>
              <option value="cbd">CBD</option>
              <option value="unknown">Unknown / N/A</option>
            </select>
          )}
        </FormField>

        {/* THC % */}
        <FormField label="THC %" hint="Leave blank if not applicable" error={errors.thcPct?.message}>
          {({ id, inputProps }) => (
            <div className={styles.percentWrapper}>
              <input
                id={id}
                {...inputProps}
                {...register('thcPct', {
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max: { value: 100, message: 'Must be ≤ 100' },
                  valueAsNumber: true,
                })}
                className={styles.input}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
              />
              <span className={styles.percentSuffix} aria-hidden="true">%</span>
            </div>
          )}
        </FormField>

        {/* CBD % */}
        <FormField label="CBD %" hint="Leave blank if not applicable" error={errors.cbdPct?.message}>
          {({ id, inputProps }) => (
            <div className={styles.percentWrapper}>
              <input
                id={id}
                {...inputProps}
                {...register('cbdPct', {
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max: { value: 100, message: 'Must be ≤ 100' },
                  valueAsNumber: true,
                })}
                className={styles.input}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
              />
              <span className={styles.percentSuffix} aria-hidden="true">%</span>
            </div>
          )}
        </FormField>

        {/* Terpenes */}
        <FormField
          label="Terpenes"
          hint="Select all that apply"
          className={styles.fullWidth}
        >
          {({ id }) => (
            <Controller
              name="terpenes"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className={styles.checkboxGrid} role="group" aria-labelledby={`${id}-label`}>
                  {COMMON_TERPENES.map((terpene) => (
                    <label key={terpene} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        value={terpene}
                        checked={field.value.includes(terpene)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, terpene]);
                          } else {
                            field.onChange(field.value.filter((t: string) => t !== terpene));
                          }
                        }}
                      />
                      {terpene}
                    </label>
                  ))}
                </div>
              )}
            />
          )}
        </FormField>

        {/* Effects */}
        <FormField
          label="Effects"
          hint="Type an effect and press Enter. e.g. 'relaxed', 'creative'"
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <Controller
              name="effects"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput
                  id={id}
                  ariaProps={inputProps}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add effects (Enter to add)…"
                />
              )}
            />
          )}
        </FormField>

        {/* Flavors */}
        <FormField
          label="Flavors"
          hint="Type a flavor and press Enter. e.g. 'earthy', 'citrus'"
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <Controller
              name="flavors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput
                  id={id}
                  ariaProps={inputProps}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add flavors (Enter to add)…"
                />
              )}
            />
          )}
        </FormField>
      </div>
    </fieldset>
  );
}


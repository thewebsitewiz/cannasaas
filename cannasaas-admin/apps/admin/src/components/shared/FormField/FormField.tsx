/**
 * @file FormField.tsx
 * @path apps/admin/src/components/shared/FormField/FormField.tsx
 *
 * Accessible form field wrapper providing consistent label, hint text,
 * and error message layout for all admin forms.
 *
 * WCAG:
 *   • <label> is programmatically associated with input via htmlFor / useId().
 *   • Error messages use role="alert" so they are announced immediately.
 *   • Hint text is linked via aria-describedby on the input.
 *   • Required fields have aria-required on the input (not just a visual asterisk).
 *   • Error state is conveyed via aria-invalid="true" on the input.
 *
 * PATTERN: Render prop (children as function) allows full control over the
 * input element while the wrapper handles all the ARIA wiring.
 *
 * @example
 * <FormField label="Product Name" required error={errors.name?.message}>
 *   {({ id, inputProps }) => (
 *     <input id={id} {...inputProps} {...register('name')} />
 *   )}
 * </FormField>
 */

import React, { useId } from 'react';
import styles from './FormField.module.css';

// ─── Input Props injected into children ───────────────────────────────────────

export interface InjectedInputProps {
  'aria-invalid': boolean;
  'aria-required': boolean;
  'aria-describedby'?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Visible label text */
  label: string;
  /** If true, adds a required asterisk and aria-required on the input */
  required?: boolean;
  /** Validation error message — triggers aria-invalid and role="alert" */
  error?: string;
  /** Supplementary hint text shown below the label */
  hint?: string;
  /** Additional CSS class on the field wrapper */
  className?: string;
  /**
   * Render prop — receives the generated input id and ARIA props.
   * Spread inputProps onto your <input>, <select>, or <textarea>.
   */
  children: (props: { id: string; inputProps: InjectedInputProps }) => React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormField({
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const inputProps: InjectedInputProps = {
    'aria-invalid': Boolean(error),
    'aria-required': required,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };

  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ''} ${className ?? ''}`}>
      {/* Label */}
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true"> *</span>
        )}
      </label>

      {/* Hint text — shown above the input */}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {/* Input (rendered by parent via render prop) */}
      <div className={styles.inputWrapper}>
        {children({ id: inputId, inputProps })}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className={styles.error}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}


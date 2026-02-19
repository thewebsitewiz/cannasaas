/**
 * @file ComplianceSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.tsx
 *
 * Cannabis compliance metadata form section.
 * Captures METRC tracking ID, batch number, and regulatory dates required
 * for state cannabis compliance reporting.
 *
 * WCAG: Date inputs have explicit labels and hint text explaining the
 * expected format. The METRC ID field has a hint linking to the expected
 * UID format per state regulations.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './ComplianceSection.module.css';

export interface ComplianceSectionProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function ComplianceSection({ register, errors }: ComplianceSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Compliance &amp; Regulatory</legend>

      <div className={styles.grid}>
        {/* METRC ID */}
        <FormField
          label="METRC UID"
          hint="The unique identifier assigned by METRC for this product/package."
          error={errors.metrcId?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('metrcId')}
              className={styles.input}
              type="text"
              placeholder="1A4060300002199000014"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </FormField>

        {/* Batch Number */}
        <FormField
          label="Batch Number"
          hint="Internal or cultivator batch identifier."
          error={errors.batchNumber?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('batchNumber')}
              className={styles.input}
              type="text"
              placeholder="BATCH-2025-001"
              autoComplete="off"
            />
          )}
        </FormField>

        {/* Harvest Date */}
        <FormField
          label="Harvest Date"
          hint="Date the cannabis was harvested (for flower/concentrates)."
          error={errors.harvestDate?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('harvestDate')}
              className={styles.input}
              type="date"
            />
          )}
        </FormField>

        {/* Expiration Date */}
        <FormField
          label="Expiration Date"
          hint="Product expiration or best-by date."
          error={errors.expirationDate?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('expirationDate')}
              className={styles.input}
              type="date"
            />
          )}
        </FormField>
      </div>

      <p className={styles.complianceNote} role="note">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        METRC UID and batch number are required for all cannabis products sold in NY, NJ, and CT.
        These fields are reported to state regulators via the Metrc Connect API integration.
      </p>
    </fieldset>
  );
}


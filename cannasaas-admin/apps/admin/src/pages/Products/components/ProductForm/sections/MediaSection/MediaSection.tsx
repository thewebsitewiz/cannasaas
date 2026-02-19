/**
 * @file MediaSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.tsx
 *
 * Product media management: drag-and-drop image upload to S3 (Sprint 3 endpoint),
 * primary image selection, and per-image alt text editing.
 *
 * UPLOAD FLOW:
 *   1. User drops files onto the dropzone or uses the file input.
 *   2. Files are validated (type, size) client-side.
 *   3. Valid files are uploaded one-by-one to /api/admin/media/upload.
 *   4. On success, the returned ProductImage is added to the form state.
 *
 * WCAG:
 *   • The dropzone has role="button", tabIndex=0, and keyboard handlers
 *     (Enter/Space) so it's operable without a mouse.
 *   • Each image thumbnail has a visible alt text field.
 *   • Upload progress is announced via aria-live="polite".
 *   • The "Set as primary" button has aria-pressed reflecting current state.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Controller, Control } from 'react-hook-form';
import type { ProductFormValues, ProductImage } from '../../../../../../types/admin.types';
import styles from './MediaSection.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 8;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MediaSectionProps {
  control: Control<ProductFormValues>;
  /** Existing images (edit mode) */
  existingImages?: ProductImage[];
  /** Currently selected primary image ID */
  primaryImageId?: string | null;
  onPrimaryImageChange?: (id: string) => void;
}

// ─── Upload State ─────────────────────────────────────────────────────────────

interface UploadItem {
  localId: string;
  file: File;
  preview: string;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
  uploadedImage?: ProductImage;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaSection({
  control,
  existingImages = [],
  primaryImageId,
  onPrimaryImageChange,
}: MediaSectionProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [altTexts, setAltTexts] = useState<Record<string, string>>(
    () => Object.fromEntries(existingImages.map((img) => [img.id, img.altText])),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  const uploadFile = useCallback(async (file: File) => {
    const localId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const preview = URL.createObjectURL(file);

    setUploads((prev) => [
      ...prev,
      { localId, file, preview, status: 'uploading' },
    ]);
    announce(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'product');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const uploadedImage: ProductImage = await res.json();

      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId ? { ...u, status: 'done', uploadedImage } : u,
        ),
      );
      announce(`${file.name} uploaded successfully`);
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId
            ? { ...u, status: 'error', errorMessage: 'Upload failed. Please retry.' }
            : u,
        ),
      );
      announce(`Failed to upload ${file.name}`);
    }
  }, []);

  const processFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        announce(`${file.name} is not a supported image type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        announce(`${file.name} exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        continue;
      }
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const allImages: Array<ProductImage & { isNew?: boolean }> = [
    ...existingImages,
    ...uploads
      .filter((u) => u.status === 'done' && u.uploadedImage)
      .map((u) => ({ ...u.uploadedImage!, isNew: true })),
  ];

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Media</legend>

      {/* Aria live for upload announcements */}
      <div ref={liveRef} role="status" aria-live="polite" className={styles.srOnly} />

      {/* ── Dropzone ──────────────────────────────────────────────── */}
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={0}
        aria-label="Upload images. Drag and drop or press Enter to browse files."
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleDropzoneKeyDown}
      >
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.dropzoneIcon}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p className={styles.dropzoneText}>
          <strong>Drop images here</strong> or <span className={styles.dropzoneBrowse}>browse files</span>
        </p>
        <p className={styles.dropzoneHint}>
          JPEG, PNG, WebP, GIF · Max {MAX_FILE_SIZE_MB}MB each
        </p>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className={styles.fileInput}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {/* ── In-progress uploads ────────────────────────────────────── */}
      {uploads.filter((u) => u.status === 'uploading').length > 0 && (
        <div className={styles.uploadingList} aria-label="Upload progress">
          {uploads
            .filter((u) => u.status === 'uploading')
            .map((u) => (
              <div key={u.localId} className={styles.uploadingItem}>
                <div className={styles.uploadingThumb}>
                  <img src={u.preview} alt="" width={40} height={40} />
                </div>
                <div className={styles.uploadingInfo}>
                  <span className={styles.uploadingName}>{u.file.name}</span>
                  <div className={styles.progressBar} role="progressbar" aria-label={`Uploading ${u.file.name}`} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.progressFill} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Image grid ────────────────────────────────────────────── */}
      {allImages.length > 0 && (
        <div className={styles.imageGrid} role="list" aria-label="Product images">
          {allImages.map((img) => {
            const isPrimary = img.id === primaryImageId;
            return (
              <div
                key={img.id}
                className={`${styles.imageCard} ${isPrimary ? styles.imageCardPrimary : ''}`}
                role="listitem"
              >
                <div className={styles.imageThumb}>
                  <img src={img.url} alt={img.altText || 'Product image'} />
                  {isPrimary && (
                    <span className={styles.primaryBadge} aria-label="Primary image">
                      ★
                    </span>
                  )}
                </div>

                {/* Alt text */}
                <div className={styles.altTextWrapper}>
                  <label htmlFor={`alt-${img.id}`} className={styles.altLabel}>Alt text</label>
                  <input
                    id={`alt-${img.id}`}
                    type="text"
                    className={styles.altInput}
                    value={altTexts[img.id] ?? img.altText}
                    onChange={(e) => setAltTexts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                    placeholder="Describe this image…"
                  />
                </div>

                {/* Set as primary */}
                <button
                  type="button"
                  className={`${styles.primaryBtn} ${isPrimary ? styles.primaryBtnActive : ''}`}
                  onClick={() => onPrimaryImageChange?.(img.id)}
                  aria-pressed={isPrimary}
                >
                  {isPrimary ? '★ Primary' : '☆ Set Primary'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}


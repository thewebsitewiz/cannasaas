// apps/storefront/src/pages/Products/ProductDetailPage.tsx
// STUB — Section 7.6 not defined in doc
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '@cannasaas/api-client';
import { FullPageLoader } from '@cannasaas/ui';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug ?? '');
  if (isLoading) return <FullPageLoader message="Loading product…" />;
  if (!product) return (
    <div role="alert" className="p-8 text-center text-[var(--color-error)]">Product not found.</div>
  );
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-4">{product.name}</h1>
      <p className="text-[var(--color-text-secondary)]">{product.description}</p>
    </div>
  );
}

// packages/ui/src/components/ProductCard/ProductCard.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Leaf } from 'lucide-react';
import { cn } from '@cannasaas/utils';
import { formatCurrency, formatThc } from '@cannasaas/utils';
import type { Product, ProductVariant } from '@cannasaas/types';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { StrainTypeBadge } from './StrainTypeBadge';
import { EffectsChips } from './EffectsChips';
import { PotencyBar } from './PotencyBar';

// ── Sub-component: Product Image with lazy loading ────────────────────────────
interface ProductImageProps {
  product: Product;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ product, className }) => {
  const [imgError, setImgError] = useState(false);
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  if (!primaryImage || imgError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-secondary)]',
          className,
        )}
        // WCAG 1.1.1: when no image, the div itself communicates the absence
        aria-label={`No image available for ${product.name}`}
        role="img"
      >
        <Leaf className="w-12 h-12 opacity-30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={primaryImage.url}
      // WCAG 1.1.1: meaningful alt text from the product data
      alt={primaryImage.altText || `${product.name} product image`}
      className={cn('object-cover w-full h-full', className)}
      loading="lazy"   // Native lazy loading for performance
      decoding="async"
      onError={() => setImgError(true)}
    />
  );
};

// ── Sub-component: Pricing with sale state ────────────────────────────────────
interface ProductPricingProps {
  variant: ProductVariant;
  className?: string;
}

const ProductPricing: React.FC<ProductPricingProps> = ({
  variant,
  className,
}) => {
  const isOnSale =
    variant.compareAtPrice !== undefined &&
    variant.compareAtPrice > variant.price;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className="text-[var(--p-text-xl)] font-bold text-[var(--color-text)]"
        // WCAG 1.3.3: use semantic text, not just color, for sale indication
        aria-label={
          isOnSale
            ? `Sale price: ${formatCurrency(variant.price)}, was ${formatCurrency(variant.compareAtPrice!)}`
            : formatCurrency(variant.price)
        }
      >
        {formatCurrency(variant.price)}
      </span>
      {isOnSale && (
        <span
          className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] line-through"
          aria-hidden="true" // Hidden from AT; aria-label on parent covers it
        >
          {formatCurrency(variant.compareAtPrice!)}
        </span>
      )}
    </div>
  );
};

// ── Sub-component: Stock indicator ───────────────────────────────────────────
const StockIndicator: React.FC<{ variant: ProductVariant }> = ({ variant }) => {
  if (variant.quantity === 0) {
    return (
      <Badge variant="destructive" size="sm" aria-label="Out of stock">
        Out of Stock
      </Badge>
    );
  }
  if (variant.quantity <= variant.lowStockThreshold) {
    return (
      <Badge
        variant="warning"
        size="sm"
        aria-label={`Low stock: ${variant.quantity} remaining`}
      >
        Only {variant.quantity} left
      </Badge>
    );
  }
  return null;
};

// ── Main: ProductCard ─────────────────────────────────────────────────────────
export interface ProductCardProps {
  product: Product;
  /** Show compact version without effects/potency bar */
  compact?: boolean;
  /** External handler for add-to-cart (triggers optimistic update + API call) */
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
  className?: string;
}

/**
 * ProductCard — Cannabis product display card
 *
 * WCAG:
 * - 1.1.1  Alt text on all images
 * - 1.3.1  Information not conveyed by color alone
 * - 1.4.3  Color contrast via token system
 * - 2.1.1  Fully keyboard navigable
 * - 2.4.4  Link purpose is clear from context
 * - 4.1.2  Proper button semantics for add-to-cart
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  onAddToCart,
  className,
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const selectedVariant = product.variants[selectedVariantIndex];
  const isOutOfStock = selectedVariant?.quantity === 0;

  const handleAddToCart = () => {
    if (selectedVariant && onAddToCart) {
      onAddToCart(product, selectedVariant);
    }
  };

  // WCAG 4.1.2: card is not itself a link; the product name and
  // "View Details" are the interactive elements. This avoids nested
  // interactive elements inside a link, which violates the HTML spec.
  return (
    <article
      className={cn(
        'relative flex flex-col',
        'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[var(--p-shadow-sm)]',
        'overflow-hidden',
        'transition-all duration-[var(--p-dur-normal)]',
        'hover:shadow-[var(--p-shadow-md)] hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]',
        className,
      )}
      aria-label={`${product.name}, ${formatCurrency(selectedVariant?.price ?? 0)}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-bg-tertiary)]">
        <ProductImage
          product={product}
          className="transition-transform duration-300 hover:scale-105"
        />

        {/* Strain type badge — overlaid on image */}
        <div className="absolute top-2 left-2">
          <StrainTypeBadge strainType={product.cannabisInfo.strainType} />
        </div>

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="brand" size="sm">
              Featured
            </Badge>
          </div>
        )}

        {/* Quick view button — visible on hover/focus */}
        <Link
          to={`/products/${product.slug}`}
          className={[
            'absolute inset-0 flex items-end justify-center pb-4',
            'opacity-0 focus:opacity-100',
            'group-hover:opacity-100',
            'transition-opacity duration-[var(--p-dur-fast)]',
          ].join(' ')}
          aria-label={`View details for ${product.name}`}
        >
          <span
            className={[
              'flex items-center gap-2 px-4 py-2',
              'bg-[var(--color-bg)]/90 backdrop-blur-sm',
              'rounded-full text-[var(--p-text-sm)] font-semibold',
              'shadow-[var(--p-shadow-md)]',
            ].join(' ')}
          >
            <Eye size={14} aria-hidden="true" />
            View Details
          </span>
        </Link>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Brand + name */}
        {product.brand && (
          <span className="text-[var(--p-text-xs)] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
            {product.brand}
          </span>
        )}

        <h3 className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] leading-snug line-clamp-2">
          <Link
            to={`/products/${product.slug}`}
            className="hover:text-[var(--color-brand)] focus:text-[var(--color-brand)] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* THC/CBD potency bar */}
        {!compact && (
          <PotencyBar
            thc={product.cannabisInfo.thcContent}
            cbd={product.cannabisInfo.cbdContent}
          />
        )}

        {/* Effects chips */}
        {!compact && product.cannabisInfo.effects.length > 0 && (
          <EffectsChips effects={product.cannabisInfo.effects.slice(0, 3)} />
        )}

        {/* Variant selector (if multiple variants exist) */}
        {product.variants.length > 1 && (
          <div
            role="group"
            aria-label="Select size"
            className="flex flex-wrap gap-1.5"
          >
            {product.variants.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantIndex(i)}
                aria-pressed={i === selectedVariantIndex}
                aria-label={`${variant.name} — ${formatCurrency(variant.price)}`}
                className={cn(
                  'px-2.5 py-1 rounded-[var(--p-radius-sm)]',
                  'text-[var(--p-text-xs)] font-semibold border',
                  'transition-all duration-[var(--p-dur-fast)]',
                  i === selectedVariantIndex
                    ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)] border-[var(--color-brand)]'
                    : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price + stock */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {selectedVariant && <ProductPricing variant={selectedVariant} />}
          {selectedVariant && <StockIndicator variant={selectedVariant} />}
        </div>

        {/* Add to cart */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleAddToCart}
          disabled={isOutOfStock || !onAddToCart}
          leftIcon={<ShoppingCart size={16} aria-hidden="true" />}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
};

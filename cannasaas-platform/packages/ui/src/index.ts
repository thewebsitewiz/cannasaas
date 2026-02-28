// ── CannaSaas UI — Public Component Surface ───────────────────────────────────
// All apps import UI components from '@cannasaas/ui'.
// Never import from deep paths inside this package.

// ── Part 4 implementations ────────────────────────────────────────────────────
export { Button,       type ButtonProps }      from './components/Button/Button';
export { Badge,        type BadgeProps }        from './components/Badge/Badge';
export { ProductCard,  type ProductCardProps }  from './components/ProductCard/ProductCard';
export { PotencyBar }                          from './components/ProductCard/PotencyBar';
export { StrainTypeBadge }                     from './components/ProductCard/StrainTypeBadge';
export { EffectsChips }                        from './components/ProductCard/EffectsChips';
export { FullPageLoader }                      from './components/FullPageLoader/FullPageLoader';

// ── Parts 5+ (stubs — uncomment as implemented) ───────────────────────────────
// export { Input }       from './components/Input/Input';
// export { Select }      from './components/Select/Select';
// export { Modal }       from './components/Modal/Modal';
// export { Toast }       from './components/Toast/Toast';
// export { DataTable }   from './components/DataTable/DataTable';
export { ThemeProvider, useTheme } from './providers/ThemeProvider';

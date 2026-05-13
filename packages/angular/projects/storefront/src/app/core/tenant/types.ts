/**
 * Storefront-visible subset of the Dispensary entity. Maps to the fields
 * fetched by `DispensaryGQL`. Slug lives on `DispensaryContextService.slug()`
 * separately because the current API does not expose it on the Dispensary
 * type — once DispensaryBySlug is wired, this type re-exports the generated
 * `DispensaryBySlugQuery['dispensaryBySlug']` shape.
 */
export interface Dispensary {
  readonly entityId: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly isPickupEnabled: boolean;
  readonly isDeliveryEnabled: boolean;
}

/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Structured error from the API */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

/** Tenant context resolved from subdomain or login */
export interface TenantContext {
  organizationId: string;
  organizationName: string;
  companyId?: string;
  dispensaryId?: string;
  dispensaryName?: string;
  brandingConfig?: BrandingConfig;
  subdomain: string;
}

export interface BrandingConfig {
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headingFont?: string;
  bodyFont?: string;
  customDomain?: string;
}

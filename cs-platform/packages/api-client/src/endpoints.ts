// ---------------------------------------------------------------------------
// Typed endpoint map — single source of truth for all API routes
// ---------------------------------------------------------------------------

export const endpoints = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    verifyEmail: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // ── Organizations (super-admin) ──────────────────────────────────────────
  organizations: {
    list: '/organizations',
    create: '/organizations',
    detail: (id: string) => `/organizations/${id}` as const,
    update: (id: string) => `/organizations/${id}` as const,
    delete: (id: string) => `/organizations/${id}` as const,
  },

  // ── Companies ────────────────────────────────────────────────────────────
  companies: {
    list: '/companies',
    create: '/companies',
    detail: (id: string) => `/companies/${id}` as const,
    update: (id: string) => `/companies/${id}` as const,
    delete: (id: string) => `/companies/${id}` as const,
    byOrg: (orgId: string) =>
      `/organizations/${orgId}/companies` as const,
  },

  // ── Dispensaries ─────────────────────────────────────────────────────────
  dispensaries: {
    list: '/dispensaries',
    create: '/dispensaries',
    detail: (id: string) => `/dispensaries/${id}` as const,
    update: (id: string) => `/dispensaries/${id}` as const,
    delete: (id: string) => `/dispensaries/${id}` as const,
    byCompany: (companyId: string) =>
      `/companies/${companyId}/dispensaries` as const,
  },

  // ── Products ─────────────────────────────────────────────────────────────
  products: {
    list: '/products',
    search: '/products/search',
    create: '/products',
    detail: (id: string) => `/products/${id}` as const,
    update: (id: string) => `/products/${id}` as const,
    delete: (id: string) => `/products/${id}` as const,
    byDispensary: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/products` as const,
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  cart: {
    get: '/cart',
    addItem: '/cart/items',
    updateItem: (itemId: string) => `/cart/items/${itemId}` as const,
    removeItem: (itemId: string) => `/cart/items/${itemId}` as const,
    applyPromo: '/cart/apply-promo',
    clear: '/cart/clear',
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: {
    list: '/orders',
    create: '/orders',
    detail: (id: string) => `/orders/${id}` as const,
    updateStatus: (id: string) => `/orders/${id}/status` as const,
    cancel: (id: string) => `/orders/${id}/cancel` as const,
    refund: (id: string) => `/orders/${id}/refund` as const,
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  customers: {
    me: '/customers/me',
    myOrders: '/customers/me/orders',
    myLoyalty: '/customers/me/loyalty',
    verifyAge: '/customers/me/verify-age',
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviews: {
    byProduct: (productId: string) =>
      `/products/${productId}/reviews` as const,
    create: (productId: string) =>
      `/products/${productId}/reviews` as const,
  },

  // ── Analytics (Admin) ─────────────────────────────────────────────────────
  analytics: {
    overview: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/analytics/dashboard` as const,
    products: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/analytics/products` as const,
    customers: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/analytics/customers` as const,
  },

  // ── POS Integration ───────────────────────────────────────────────────────
  pos: {
    configure: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos/configure` as const,
    status: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos/status` as const,
    sync: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos/sync` as const,
    testConnection: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos/test-connection` as const,
    syncLogs: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos/sync-logs` as const,
    remove: (dispensaryId: string) =>
      `/dispensaries/${dispensaryId}/pos` as const,
  },

  // ── AI Services ───────────────────────────────────────────────────────────
  ai: {
    productDescription: '/ai/product-description',
    recommendations: '/ai/recommendations',
    chatbot: '/ai/chatbot',
  },
} as const;

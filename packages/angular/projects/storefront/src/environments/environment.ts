interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
  /**
   * Slug used when a request can't be mapped to a tenant (no subdomain on
   * production, no path prefix on dev). Set to null to redirect to a generic
   * landing page instead.
   */
  readonly defaultDispensarySlug: string | null;
  readonly themeBaseUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.cannasaas.com',
  graphqlUrl: 'https://api.cannasaas.com/graphql',
  defaultDispensarySlug: null,
  themeBaseUrl: '/themes',
};

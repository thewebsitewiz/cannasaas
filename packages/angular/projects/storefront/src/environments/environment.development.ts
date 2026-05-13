interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
  readonly defaultDispensarySlug: string | null;
  readonly defaultDispensaryEntityId: string | null;
  readonly themeBaseUrl: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  // Test dispensary from root CLAUDE.md — used when localhost has no slug.
  defaultDispensarySlug: 'greenleaf',
  defaultDispensaryEntityId: 'c0000000-0000-0000-0000-000000000001',
  themeBaseUrl: '/themes',
};

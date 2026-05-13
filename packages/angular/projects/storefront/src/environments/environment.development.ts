interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
  readonly defaultDispensarySlug: string | null;
  readonly themeBaseUrl: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  // Test dispensary slug from root CLAUDE.md — used when localhost has no path prefix.
  defaultDispensarySlug: 'greenleaf',
  themeBaseUrl: '/themes',
};

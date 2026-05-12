interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
  readonly dispensaryId: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  dispensaryId: 'c0000000-0000-0000-0000-000000000001',
};

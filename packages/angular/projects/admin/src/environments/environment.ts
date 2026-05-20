interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
};

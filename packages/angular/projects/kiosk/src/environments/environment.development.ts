interface KioskAuth {
  readonly email: string;
  readonly password: string;
}

interface Environment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly graphqlUrl: string;
  readonly dispensaryId: string;
  readonly idleTimeoutMs: number;
  readonly kioskAuth?: KioskAuth;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  dispensaryId: 'c0000000-0000-0000-0000-000000000001',
  idleTimeoutMs: 90_000,
  // Dev-only fallback. Production environment.ts omits this and requires a
  // provisioned device token via /setup.
  kioskAuth: {
    email: 'kiosk@greenleaf.com',
    password: 'password123',
  },
};

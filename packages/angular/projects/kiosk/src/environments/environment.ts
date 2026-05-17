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
  /**
   * Dev-only fallback creds for the kiosk service account. Production builds
   * leave this undefined and require a device token issued via the
   * `provisionKiosk` mutation, applied at `/setup?token=…`.
   */
  readonly kioskAuth?: KioskAuth;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  dispensaryId: 'c0000000-0000-0000-0000-000000000001',
  idleTimeoutMs: 90_000,
};

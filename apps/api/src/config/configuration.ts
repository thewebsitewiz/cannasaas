// apps/api/src/config/configuration.ts
export const configuration = () => ({
  nodeEnv:    process.env['NODE_ENV'] ?? 'development',
  port:       parseInt(process.env['PORT'] ?? '3000', 10),
  corsOrigins: (process.env['CORS_ORIGINS'] ?? '').split(',').filter(Boolean),
  database: {
    url:      process.env['DATABASE_URL'],
    poolMin:  parseInt(process.env['DATABASE_POOL_MIN'] ?? '2', 10),
    poolMax:  parseInt(process.env['DATABASE_POOL_MAX'] ?? '20', 10),
  },
  redis: {
    url:      process.env['REDIS_URL'],
    prefix:   process.env['REDIS_PREFIX'] ?? 'cannasaas:',
  },
  jwt: {
    secret:        process.env['JWT_SECRET'],
    refreshSecret: process.env['JWT_REFRESH_SECRET'],
    accessTtl:     parseInt(process.env['JWT_ACCESS_TTL'] ?? '900', 10),
    refreshTtl:    parseInt(process.env['JWT_REFRESH_TTL'] ?? '604800', 10),
  },
  aws: {
    region:     process.env['AWS_REGION'] ?? 'us-east-1',
    s3Bucket:   process.env['AWS_S3_BUCKET'],
    s3Endpoint: process.env['AWS_S3_ENDPOINT'],
    kmsKeyId:   process.env['AWS_KMS_KEY_ID'],
    sesFrom:    process.env['AWS_SES_FROM_EMAIL'],
  },
  metrc: {
    integratorApiKey: process.env['METRC_INTEGRATOR_API_KEY'],
    sandboxMode:      process.env['METRC_SANDBOX_MODE'] === 'true',
    baseUrl:          process.env['METRC_BASE_URL'] || 'https://api-{state}.metrc.com', // {state} replaced at runtime with lowercase state code
    sandbox:          process.env['METRC_SANDBOX'] === 'true',
  },
  opensearch: {
    endpoint:    process.env['OPENSEARCH_ENDPOINT'] ?? 'http://localhost:9200',
    username:    process.env['OPENSEARCH_USERNAME'] ?? 'admin',
    password:    process.env['OPENSEARCH_PASSWORD'] ?? 'admin',
    indexPrefix: process.env['OPENSEARCH_INDEX_PREFIX'] ?? 'cannasaas_dev_',
  },
  stripe: {
    secretKey:     process.env['STRIPE_SECRET_KEY'],
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'],
  },
  features: {
    aiIdVerification: process.env['ENABLE_AI_ID_VERIFICATION'] === 'true',
    budtenderVideo:   process.env['ENABLE_BUDTENDER_VIDEO'] === 'true',
  },
});

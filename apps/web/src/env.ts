import { serverEnvSchema, type ServerEnv } from "@smm/shared";

function loadEnv(): ServerEnv {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return {
      NODE_ENV: (process.env.NODE_ENV as ServerEnv["NODE_ENV"]) ?? "development",
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://localhost:5432/smm",
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "00000000000000000000000000000000-dev-only-32chars",
      AUTH_URL: process.env.AUTH_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      REDIS_URL: process.env.REDIS_URL,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_REGION: process.env.S3_REGION,
      S3_BUCKET: process.env.S3_BUCKET,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      META_APP_ID: process.env.META_APP_ID,
      META_APP_SECRET: process.env.META_APP_SECRET,
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
      X_CLIENT_ID: process.env.X_CLIENT_ID,
      X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
      CRON_SECRET: process.env.CRON_SECRET,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_DEFAULT_PRICE_ID: process.env.STRIPE_DEFAULT_PRICE_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
    };
  }
  return serverEnvSchema.parse(process.env);
}

export const env = loadEnv();

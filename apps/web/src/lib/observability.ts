/**
 * Optional error reporting when SENTRY_DSN is set.
 * Install @sentry/nextjs and call Sentry.captureException in production if needed.
 */
export function captureServerException(err: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) return;
  console.error("[error]", context ?? {}, err);
}

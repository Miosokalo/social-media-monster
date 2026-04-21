import { z } from "zod";

const envSchema = z.object({
  PROJECTS_CONFIG_PATH: z.string().default("./config/projects.yaml"),
  GITHUB_TOKEN: z.string().optional(),
  CONTROL_PLANE_DATA_DIR: z.string().default("./data"),
  TICKET_WEBHOOK_SECRET: z.string().optional(),
  DEPLOY_WEBHOOK_SECRET: z.string().optional(),
  CONTROL_PLANE_EXPOSE_HOST_METRICS: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().default(8000),
  HEALTH_CACHE_TTL_SECONDS: z.coerce.number().default(60),
  /** Comma-separated paths for statfs (e.g. `/,/var/lib/docker`). Default root `/`. */
  SYSTEM_DISK_PATHS: z.string().optional().default("/"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}

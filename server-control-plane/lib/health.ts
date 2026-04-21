import { getEnv } from "@/lib/env";
import type { ProjectConfig } from "@/lib/schema";

export type HealthResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error?: string;
  checkedAt: string;
};

const memoryCache = new Map<
  string,
  { expires: number; value: HealthResult }
>();

function healthUrl(project: ProjectConfig): string {
  return project.urls.healthCheck ?? project.urls.public;
}

export async function checkProjectHealth(project: ProjectConfig): Promise<HealthResult> {
  const env = getEnv();
  const key = project.id;
  const now = Date.now();
  const ttlMs = env.HEALTH_CACHE_TTL_SECONDS * 1000;
  const hit = memoryCache.get(key);
  if (hit && hit.expires > now) {
    return hit.value;
  }

  const url = healthUrl(project);
  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), env.HEALTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
    });
    clearTimeout(t);
    const latencyMs = Date.now() - started;
    const result: HealthResult = {
      ok: res.ok,
      statusCode: res.status,
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
    memoryCache.set(key, { expires: now + ttlMs, value: result });
    return result;
  } catch (e) {
    clearTimeout(t);
    const latencyMs = Date.now() - started;
    const message = e instanceof Error ? e.message : String(e);
    const result: HealthResult = {
      ok: false,
      statusCode: null,
      latencyMs,
      error: message,
      checkedAt: new Date().toISOString(),
    };
    memoryCache.set(key, { expires: now + ttlMs, value: result });
    return result;
  }
}

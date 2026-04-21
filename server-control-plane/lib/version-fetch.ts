import type { ProjectConfig } from "@/lib/schema";
import { getEnv } from "@/lib/env";

export type LiveVersionPayload = {
  commit?: string;
  shortCommit?: string;
  buildTime?: string;
  semver?: string;
  raw: unknown;
};

export async function fetchLiveVersion(
  project: ProjectConfig
): Promise<{ ok: boolean; version?: LiveVersionPayload; error?: string }> {
  const url = project.version?.url;
  if (!url) {
    return { ok: false, error: "No version.url configured for this project." };
  }
  const env = getEnv();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), env.HEALTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status} from version endpoint`,
      };
    }
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Version endpoint did not return JSON." };
    }
    const obj = json as Record<string, unknown>;
    const commit =
      (typeof obj.commit === "string" && obj.commit) ||
      (typeof obj.sha === "string" && obj.sha) ||
      (typeof obj.gitSha === "string" && obj.gitSha) ||
      undefined;
    const shortCommit =
      typeof obj.shortCommit === "string"
        ? obj.shortCommit
        : commit
          ? commit.slice(0, 7)
          : undefined;
    const buildTime =
      typeof obj.buildTime === "string"
        ? obj.buildTime
        : typeof obj.builtAt === "string"
          ? obj.builtAt
          : undefined;
    const semver = typeof obj.version === "string" ? obj.version : undefined;
    return {
      ok: true,
      version: {
        commit,
        shortCommit,
        buildTime,
        semver,
        raw: json,
      },
    };
  } catch (e) {
    clearTimeout(t);
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

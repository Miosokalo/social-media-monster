import { getEffectiveLimits } from "@/lib/limits";
import { getMonthlyUsage } from "@/lib/usage";

export type QuotaKind = "studio_message" | "publish";

export async function assertQuota(opts: {
  workspaceId: string;
  subscriptionStatus: string | null | undefined;
  isFounderService: boolean;
  kind: QuotaKind;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  if (opts.isFounderService) return { ok: true };
  const limits = getEffectiveLimits({
    isFounderService: false,
    subscriptionStatus: opts.subscriptionStatus,
  });
  const u = await getMonthlyUsage(opts.workspaceId);
  const studioN = Number(u.studioMessages ?? 0);
  const pubN = Number(u.postsPublished ?? 0);
  if (opts.kind === "studio_message") {
    if (studioN >= limits.maxStudioTurnsPerMonth) {
      return { ok: false, code: "studio_quota" };
    }
  }
  if (opts.kind === "publish") {
    if (pubN >= limits.maxScheduledPerMonth) {
      return { ok: false, code: "publish_quota" };
    }
  }
  return { ok: true };
}

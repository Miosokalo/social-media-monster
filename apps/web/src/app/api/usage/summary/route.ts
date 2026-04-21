import { NextResponse } from "next/server";
import { getEffectiveLimits } from "@/lib/limits";
import { getMonthlyUsage } from "@/lib/usage";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const usage = await getMonthlyUsage(w.workspace.id);
  const limits = getEffectiveLimits({
    isFounderService: w.isFounderService,
    subscriptionStatus: w.workspace.subscriptionStatus,
  });
  return NextResponse.json({
    postsPublished: usage.postsPublished,
    studioMessages: usage.studioMessages,
    limits: {
      maxPostsPerMonth: limits.maxScheduledPerMonth,
      maxStudioTurnsPerMonth: limits.maxStudioTurnsPerMonth,
    },
    subscriptionStatus: w.workspace.subscriptionStatus ?? "none",
    summary: `Posts diesen Monat: ${usage.postsPublished} / ${limits.maxScheduledPerMonth}\nStudio-Nachrichten: ${usage.studioMessages} / ${limits.maxStudioTurnsPerMonth}`,
  });
}

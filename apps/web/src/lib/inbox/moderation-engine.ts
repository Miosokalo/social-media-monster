import { eq } from "drizzle-orm";
import { db } from "@/db";
import { inboxItems, moderationRules } from "@/db/schema";

type InboxStatus = "open" | "in_progress" | "done" | "spam";

export async function applyModerationRules(
  workspaceId: string,
  itemId: string,
  text: string,
): Promise<{ status: InboxStatus; matchedRuleId?: string }> {
  const rules = await db
    .select()
    .from(moderationRules)
    .where(eq(moderationRules.workspaceId, workspaceId));
  const active = rules.filter((r) => r.active);
  for (const r of active) {
    let hit = false;
    if (r.matchType === "contains") {
      hit = text.toLowerCase().includes(r.pattern.toLowerCase());
    } else if (r.matchType === "regex") {
      try {
        hit = new RegExp(r.pattern, "i").test(text);
      } catch {
        continue;
      }
    }
    if (!hit) continue;
    let status: InboxStatus = "open";
    if (r.action === "flag") status = "in_progress";
    if (r.action === "hide_suggested") status = "spam";
    await db
      .update(inboxItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(inboxItems.id, itemId));
    return { status, matchedRuleId: r.id };
  }
  return { status: "open" };
}

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAuditLog(opts: {
  workspaceId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    workspaceId: opts.workspaceId,
    userId: opts.userId,
    action: opts.action,
    entityType: opts.entityType,
    entityId: opts.entityId ?? null,
    metadata: opts.metadata ?? null,
  });
}

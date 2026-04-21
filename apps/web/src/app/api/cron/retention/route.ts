import { lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { env } from "@/env";
import { log } from "@/lib/logger";

const RETENTION_DAYS = 90;

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const deleted = await db
    .delete(chatMessages)
    .where(lt(chatMessages.createdAt, cutoff))
    .returning({ id: chatMessages.id });
  log.info("cron_retention_chat", { deleted: deleted.length });
  return NextResponse.json({ deletedChatMessages: deleted.length });
}

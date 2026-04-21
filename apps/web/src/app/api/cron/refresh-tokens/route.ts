import { NextResponse } from "next/server";
import { env } from "@/env";
import { runTokenRefreshSweep } from "@/lib/token-refresh";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { updated } = await runTokenRefreshSweep();
  log.info("cron_refresh_tokens", { updated });
  return NextResponse.json({ updated });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { verifyHmacSha256Hex } from "@/lib/webhook-verify";
import { appendDeployEvent } from "@/lib/store";
import { getProjectById } from "@/lib/load-config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(["building", "success", "failure", "cancelled"]),
  commit: z.string().optional(),
  message: z.string().optional(),
  at: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = getEnv().DEPLOY_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-control-plane-signature");
    if (!verifyHmacSha256Hex(secret, raw, sig)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await getProjectById(parsed.data.projectId);
  if (!project) {
    return NextResponse.json({ error: "Unknown projectId" }, { status: 404 });
  }

  const row = await appendDeployEvent(parsed.data);
  return NextResponse.json({ ok: true, event: row });
}

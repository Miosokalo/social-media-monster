import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getSystemOverview } from "@/lib/system-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getEnv();
  if (!env.CONTROL_PLANE_EXPOSE_HOST_METRICS) {
    return NextResponse.json({ error: "Host metrics disabled" }, { status: 403 });
  }
  const overview = await getSystemOverview(env.SYSTEM_DISK_PATHS);
  return NextResponse.json(overview);
}

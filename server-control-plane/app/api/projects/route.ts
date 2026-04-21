import { NextResponse } from "next/server";
import { loadProjectsConfig } from "@/lib/load-config";
import { buildProjectSummary } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await loadProjectsConfig();
    const summaries = await Promise.all(projects.map((p) => buildProjectSummary(p)));
    return NextResponse.json({ projects: summaries });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

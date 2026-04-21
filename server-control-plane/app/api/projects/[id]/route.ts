import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/load-config";
import { buildProjectDetail } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const detail = await buildProjectDetail(project);
    return NextResponse.json(detail);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

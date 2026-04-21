import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ platform: string }> },
) {
  const { platform } = await ctx.params;
  const url = new URL(req.url);
  if (platform === "meta" || platform === "meta_facebook") {
    const q = url.searchParams.toString();
    const target = new URL(
      `/api/oauth/meta/start${q ? `?${q}` : ""}`,
      url.origin,
    );
    return NextResponse.redirect(target.toString());
  }
  if (platform === "linkedin") {
    const q = url.searchParams.toString();
    const target = new URL(
      `/api/oauth/linkedin/start${q ? `?${q}` : ""}`,
      url.origin,
    );
    return NextResponse.redirect(target.toString());
  }
  if (platform === "x" || platform === "twitter") {
    const q = url.searchParams.toString();
    const target = new URL(
      `/api/oauth/x/start${q ? `?${q}` : ""}`,
      url.origin,
    );
    return NextResponse.redirect(target.toString());
  }
  return NextResponse.json(
    {
      message: "oauth_not_implemented",
      platform,
      hint: "Meta/LinkedIn/X: /api/oauth/{provider}/start?brandEntityId=…",
    },
    { status: 501 },
  );
}

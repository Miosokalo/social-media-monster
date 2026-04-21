import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const id = request.headers.get("x-request-id") ?? nanoid();
  const res = NextResponse.next();
  res.headers.set("x-request-id", id);
  return res;
}

export const config = {
  matcher: "/api/:path*",
};

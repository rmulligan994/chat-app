import { NextRequest, NextResponse } from "next/server";

/**
 * GET|POST /api/health
 * Debug endpoint — returns request info to help diagnose routing issues.
 */
async function handler(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    basePath: request.nextUrl.basePath,
    headers: Object.fromEntries(request.headers.entries()),
  });
}

export const GET = handler;
export const POST = handler;


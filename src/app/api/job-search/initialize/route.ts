import { NextResponse } from "next/server";
import { initializeJobSearch } from "@/lib/typesense";

/**
 * POST|GET /api/job-search/initialize
 * Loads filter options from Typesense. Call on app startup.
 */
export async function GET() {
  try {
    const filters = await initializeJobSearch();
    return NextResponse.json({ status: "ok", filters });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Initialize error:", error);
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const filters = await initializeJobSearch();
    return NextResponse.json({ status: "ok", filters });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Initialize error:", error);
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}

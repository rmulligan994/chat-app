import { NextResponse } from "next/server";
import { getFilterOptions } from "@/lib/typesense";

/**
 * GET /api/job-search/filters
 * Returns available filter values for UI dropdowns.
 */
export async function GET() {
  return NextResponse.json(getFilterOptions());
}


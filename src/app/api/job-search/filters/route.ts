import { NextResponse } from "next/server";
import { getFilterOptions } from "@/lib/typesense";

/**
 * GET|POST /api/job-search/filters
 * Returns available filter values for UI dropdowns.
 */
async function handler() {
  return NextResponse.json(getFilterOptions());
}

export const GET = handler;
export const POST = handler;

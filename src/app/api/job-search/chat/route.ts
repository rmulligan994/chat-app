import { NextRequest, NextResponse } from "next/server";
import { jobSearchChat } from "@/lib/typesense";

/**
 * POST /api/job-search/chat
 * Body: {
 *   "message": "RN jobs in Florida",
 *   "conversation_id": "optional",
 *   "settings": {                          ← optional overrides
 *     "perPage": 50,
 *     "systemPrompt": "Only suggest full-time roles",
 *     "collectionName": "jobs_v2",
 *     "modelId": "job-search-assistant",
 *     "defaultFilters": { "state": "FL" }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string;
      conversation_id?: string;
      settings?: Record<string, unknown>;
    };
    const { message, conversation_id, settings } = body;

    if (!message) {
      return NextResponse.json(
        { status: "error", detail: "message is required" },
        { status: 400 }
      );
    }

    const result = await jobSearchChat(message, conversation_id, settings);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat error:", error);
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}


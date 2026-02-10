import { NextRequest, NextResponse } from "next/server";
import { jobSearchChat } from "@/lib/typesense";

/**
 * POST|GET /api/job-search/chat
 * Body (POST): {
 *   "message": "RN jobs in Florida",
 *   "conversation_id": "optional",
 *   "settings": { ... }
 * }
 * For GET: reads params from query string (?message=...&conversation_id=...)
 */
export async function GET(request: NextRequest) {
  try {
    const chatMessage = request.nextUrl.searchParams.get("message") ?? undefined;
    const conversationId =
      request.nextUrl.searchParams.get("conversation_id") ?? undefined;

    if (!chatMessage) {
      return NextResponse.json(
        { status: "error", detail: "message is required" },
        { status: 400 }
      );
    }

    const result = await jobSearchChat(chatMessage, conversationId, undefined);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat error:", error);
    return NextResponse.json(
      { status: "error", detail: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string;
      conversation_id?: string;
      settings?: Record<string, unknown>;
    };
    const chatMessage = body.message;
    const conversationId = body.conversation_id;
    const settings = body.settings;

    if (!chatMessage) {
      return NextResponse.json(
        { status: "error", detail: "message is required" },
        { status: 400 }
      );
    }

    const result = await jobSearchChat(chatMessage, conversationId, settings);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat error:", error);
    return NextResponse.json(
      { status: "error", detail: errMessage },
      { status: 500 }
    );
  }
}

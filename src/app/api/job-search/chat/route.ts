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
async function handler(request: NextRequest) {
  try {
    let chatMessage: string | undefined;
    let conversationId: string | undefined;
    let settings: Record<string, unknown> | undefined;

    if (request.method === "POST") {
      const body = (await request.json()) as {
        message?: string;
        conversation_id?: string;
        settings?: Record<string, unknown>;
      };
      chatMessage = body.message;
      conversationId = body.conversation_id;
      settings = body.settings;
    } else {
      // GET fallback — read from query params
      chatMessage = request.nextUrl.searchParams.get("message") ?? undefined;
      conversationId =
        request.nextUrl.searchParams.get("conversation_id") ?? undefined;
    }

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

export const GET = handler;
export const POST = handler;

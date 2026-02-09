import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInPdf } from "@/lib/linkedin-parser";

/**
 * POST /api/linkedin/parse
 * Accepts a PDF file upload (multipart/form-data, field name "file").
 * Returns structured profile JSON parsed by OpenAI.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", detail: "No file uploaded. Send a 'file' field." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { status: "error", detail: "Please upload a PDF file." },
        { status: 400 }
      );
    }

    // Convert the Web File to a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const profile = await parseLinkedInPdf(buffer);

    return NextResponse.json({ status: "ok", profile });
  } catch (error: unknown) {
    console.error("LinkedIn parse error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          status: "error",
          detail: "Could not parse the profile. The PDF may not be a LinkedIn export.",
        },
        { status: 422 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}


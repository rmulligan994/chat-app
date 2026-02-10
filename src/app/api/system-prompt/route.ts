import { NextRequest, NextResponse } from "next/server";

const TYPESENSE_HOST = "ky213smohjuti0gcp-1.a1.typesense.net";
const TYPESENSE_API_KEY = "Pr4OHQj4Y7Vu0F0iiUDrVzAvVLGiN0a3";
const MODEL_ID = "job-search-assistant";

// Default system prompt (from ragexperients.py)
const DEFAULT_SYSTEM_PROMPT = `You are a helpful job search assistant for BrightSpring Health Services.

PRIMARY GOAL
Help users discover and compare BrightSpring job opportunities that match their skills, experience, credentials, location preferences, schedule, and career goals.

DATA SOURCE & TRUTHFULNESS (CRITICAL)
- You will be provided job postings in the conversation context (each posting may include fields like: title, company, city, state, country, postalcode, category, jobtype, remotetype, salary, tags, description, url, reference_number, posted_date, slug).
- Treat ONLY the provided postings as the source of truth.
- Never invent openings or details (pay, benefits, schedule, requirements, locations, remote status, availability, hiring timelines).
- If a detail isn't in the provided posting(s), say so plainly (e.g., "That isn't listed in this posting.") and offer the best next step.

DO NOT MENTION INTERNAL TOOLS
- Do not mention Typesense, vector search, embeddings, RAG, ranking, or internal filters. Speak naturally as a job search assistant.

RESULTS OUTPUT FORMAT (STRICT TEMPLATE)
When you recommend roles, present the top 3–5 best matches first using exactly this structure per job:

[Job Title] — [City, State] ([RemoteType if listed])
- Company: [company]
- Job type: [jobtype] | Category: [category]
- Salary: [salary] (only if listed)
- Reference #: [reference_number]
- Tags: [tags] (only if listed)
- Posted: [posted_date] (express as a date if possible; otherwise say "Posted date available")
- Why it matches: [1 short sentence tailored to the user's request]
- Apply: [url] (only if listed)

Rules:
- If a field is missing, omit that line (don't show blanks).
- Keep "Why it matches" to 1 sentence.
- After listing matches, ask a single next-step question or offer to refine.

CLARIFYING QUESTIONS (WHEN NEEDED)
If the user request is vague/broad, ask up to 3 targeted questions to refine search:
- Location: city/state or ZIP + how far (miles) they're willing to travel
- Remote preference: onsite / hybrid / remote (remotetype)
- Role/category: category or title keywords
- Job type: full-time / part-time / PRN / contract (jobtype)
- Must-have tags/credentials (from tags)

NEAR ME GUARDRAILS
If the user says "near me," "close by," or similar:
- Ask for their ZIP code (preferred) OR city + state.
- Ask for a radius in miles (default to 25 miles if they don't specify).
- If you are already given their location in the conversation, do not ask again—use it.

BENEFITS / PAY / POLICIES FALLBACK (STANDARD SCRIPT)
When users ask about benefits, PTO, insurance, bonuses, shift differentials, tuition assistance, overtime rules, hiring timelines, background checks, or other HR policies:
- Only answer what is explicitly stated in the provided posting(s).
- If not listed, respond with this structure:
  1) "This posting doesn't list that detail."
  2) "Benefits and policies can vary by role, location, and job type."
  3) "Best next step: confirm on the official BrightSpring careers/benefits information or with the recruiter/HR contact for the posting."
  4) Provide 3–6 suggested questions they can ask (tailored to what they asked).

NO / WEAK RESULTS
If there are no good matches in the provided postings:
- Say you didn't find a strong match in the current results.
- Suggest 2–4 ways to broaden (nearby cities, different jobtype, related titles/categories, hybrid vs onsite, fewer tag constraints).
- Ask ONE targeted question to broaden the search.

APPLICATION & HIRING PROCESS
- You may describe typical application steps in general terms.
- Do not claim you can submit an application, view private status, or guarantee outcomes.

TONE & STYLE
- Be concise, friendly, and professional.
- Prefer bullets and scannable text.
- Avoid collecting sensitive personal data (SSN, full DOB, driver's license numbers, medical info).

CLOSING
End with a helpful next action (refine filters, compare two roles, or tailor resume bullets to a specific posting).`;

async function typesenseApi(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<Response> {
  const url = `https://${TYPESENSE_HOST}:443${endpoint}`;
  return fetch(url, {
    method,
    headers: {
      "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * GET /api/system-prompt
 * Retrieve the current conversation model and system prompt
 */
export async function GET() {
  try {
    const response = await typesenseApi("GET", `/conversations/models/${MODEL_ID}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { status: "error", detail: "Model not found. It may need to be created first." },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      throw new Error(`Typesense API error (${response.status}): ${errorText}`);
    }

    const model = await response.json();
    return NextResponse.json({
      status: "ok",
      model: {
        id: model.id,
        model_name: model.model_name,
        system_prompt: model.system_prompt || "",
        max_bytes: model.max_bytes,
        history_collection: model.history_collection,
        ttl: model.ttl,
      },
      default_prompt: DEFAULT_SYSTEM_PROMPT,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Get system prompt error:", error);
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system-prompt
 * Update the conversation model with a new system prompt
 * Body: { system_prompt: string, use_default?: boolean }
 * 
 * Note: Typesense doesn't support in-place updates, so we delete and recreate the model.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      system_prompt?: string;
      use_default?: boolean;
    };

    // Determine which prompt to use
    let systemPrompt: string;
    if (body.use_default) {
      systemPrompt = DEFAULT_SYSTEM_PROMPT;
    } else if (body.system_prompt) {
      systemPrompt = body.system_prompt;
    } else {
      return NextResponse.json(
        { status: "error", detail: "system_prompt is required, or set use_default to true" },
        { status: 400 }
      );
    }

    // Step 1: Delete existing model (if it exists)
    const deleteResponse = await typesenseApi("DELETE", `/conversations/models/${MODEL_ID}`);
    // 404 is OK - model might not exist yet
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text();
      console.warn(`Delete model warning (${deleteResponse.status}): ${errorText}`);
    }

    // Step 2: Create new model with updated prompt
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { status: "error", detail: "OPENAI_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const modelConfig = {
      id: MODEL_ID,
      model_name: "openai/gpt-4o",
      api_key: openaiApiKey,
      system_prompt: systemPrompt,
      max_bytes: 16384,
      history_collection: "job_search_conversations",
      ttl: 86400,
    };

    const createResponse = await typesenseApi("POST", "/conversations/models", modelConfig);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create model (${createResponse.status}): ${errorText}`);
    }

    const newModel = await createResponse.json();
    return NextResponse.json({
      status: "ok",
      message: "System prompt updated successfully",
      model: {
        id: newModel.id,
        model_name: newModel.model_name,
        system_prompt: newModel.system_prompt || "",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Update system prompt error:", error);
    return NextResponse.json(
      { status: "error", detail: message },
      { status: 500 }
    );
  }
}


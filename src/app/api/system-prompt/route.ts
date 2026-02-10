import { NextRequest, NextResponse } from "next/server";

const TYPESENSE_HOST = process.env.TYPESENSE_HOST || "ky213smohjuti0gcp-1.a1.typesense.net";
// For model management (create/read/delete), we need an ADMIN key, not a search-only key
// Check environment variable first, then fall back to hardcoded (which should be an admin key)
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || "Pr4OHQj4Y7Vu0F0iiUDrVzAvVLGiN0a3";
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
    const apiKeySource = process.env.TYPESENSE_API_KEY ? "environment" : "hardcoded";
    const apiKeyPreview = TYPESENSE_API_KEY.substring(0, 10) + "...";
    console.log(`Fetching model: ${MODEL_ID} from ${TYPESENSE_HOST}`);
    console.log(`API key source: ${apiKeySource}, key: ${apiKeyPreview} (length: ${TYPESENSE_API_KEY.length})`);
    
    const response = await typesenseApi("GET", `/conversations/models/${MODEL_ID}`);
    
    console.log(`Response status: ${response.status}, ok: ${response.ok}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Try to get more info about why it's 404
        let errorText: string;
        try {
          errorText = await response.text();
        } catch {
          errorText = "Could not read error response";
        }
        console.error(`Model not found (404). Error: ${errorText}`);
        
        // Try listing all models to see what exists
        try {
          const listResponse = await typesenseApi("GET", "/conversations/models");
          console.log(`List models response: ${listResponse.status}, ok: ${listResponse.ok}`);
          
          if (listResponse.ok) {
            const listText = await listResponse.text();
            console.log("List models response text:", listText.substring(0, 500));
            
            let allModels: Array<{ id: string }> = [];
            try {
              const parsed = JSON.parse(listText);
              // Typesense might return an array directly or wrapped in an object
              if (Array.isArray(parsed)) {
                allModels = parsed;
              } else if (parsed.models && Array.isArray(parsed.models)) {
                allModels = parsed.models;
              } else if (parsed.conversation_models && Array.isArray(parsed.conversation_models)) {
                allModels = parsed.conversation_models;
              }
            } catch (parseError) {
              console.error("Failed to parse list models response:", parseError);
            }
            
            console.log("Available models:", allModels.map(m => m.id));
            
            return NextResponse.json(
              { 
                status: "error", 
                detail: "Model not found. It may need to be created first.",
                debug: {
                  model_id: MODEL_ID,
                  endpoint: `/conversations/models/${MODEL_ID}`,
                  typesense_error: errorText,
                  available_models: allModels.map(m => m.id),
                  list_response_status: listResponse.status,
                  api_key_source: process.env.TYPESENSE_API_KEY ? "environment" : "hardcoded",
                  api_key_preview: TYPESENSE_API_KEY.substring(0, 10) + "...",
                  note: "Python script can read/list models with the same key. If available_models is empty here, check if Cloudflare Workers has a different TYPESENSE_API_KEY env var set."
                }
              },
              { status: 404 }
            );
          } else {
            const listErrorText = await listResponse.text();
            console.error("List models failed:", listErrorText);
          }
        } catch (listError) {
          console.error("Failed to list models:", listError);
        }
        
        return NextResponse.json(
          { 
            status: "error", 
            detail: "Model not found. It may need to be created first.",
            debug: {
              model_id: MODEL_ID,
              endpoint: `/conversations/models/${MODEL_ID}`,
              typesense_error: errorText,
            }
          },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error(`Typesense API error (${response.status}): ${errorText}`);
      throw new Error(`Typesense API error (${response.status}): ${errorText}`);
    }

    let model: {
      id: string;
      model_name: string;
      system_prompt?: string;
      max_bytes?: number;
      history_collection?: string;
      ttl?: number;
    };
    
    try {
      model = (await response.json()) as typeof model;
      console.log(`Model retrieved successfully: ${model.id}`);
    } catch (jsonError) {
      const responseText = await response.text();
      console.error("Failed to parse model JSON:", jsonError);
      console.error("Response text:", responseText);
      throw new Error(`Failed to parse model response: ${responseText}`);
    }
    
    return NextResponse.json({
      status: "ok",
      model: {
        id: model.id,
        model_name: model.model_name,
        system_prompt: model.system_prompt || "",
        max_bytes: model.max_bytes || 16384,
        history_collection: model.history_collection || "job_search_conversations",
        ttl: model.ttl || 86400,
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

    // Step 1: Validate we can create the model before deleting
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

    console.log("Attempting to create/update model:", {
      id: modelConfig.id,
      model_name: modelConfig.model_name,
      system_prompt_length: modelConfig.system_prompt.length,
      api_key_set: !!openaiApiKey,
    });

    // Step 2: Delete existing model (if it exists) - but only if we're sure we can recreate
    const deleteResponse = await typesenseApi("DELETE", `/conversations/models/${MODEL_ID}`);
    // 404 is OK - model might not exist yet
    if (deleteResponse.ok) {
      console.log(`Model deleted successfully. Waiting for Typesense to process deletion...`);
      // Wait a bit for Typesense to fully process the deletion before creating a new one
      // This prevents race conditions where Typesense might assign a UUID instead of our ID
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text();
      console.warn(`Delete model warning (${deleteResponse.status}): ${errorText}`);
      // Don't fail here - continue to try creating
    } else {
      console.log("Model doesn't exist yet (404), proceeding to create");
    }

    // Step 3: Verify the model is actually gone before creating (to avoid conflicts)
    try {
      const checkResponse = await typesenseApi("GET", `/conversations/models/${MODEL_ID}`);
      if (checkResponse.ok) {
        console.warn("Model still exists after deletion attempt. Waiting longer...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Try deleting again
        const retryDelete = await typesenseApi("DELETE", `/conversations/models/${MODEL_ID}`);
        if (retryDelete.ok) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch {
      // 404 is expected - model doesn't exist, which is what we want
      console.log("Model confirmed deleted (or never existed)");
    }

    // Step 4: Create new model with updated prompt
    console.log("Creating model with config:", {
      id: modelConfig.id,
      model_name: modelConfig.model_name,
      system_prompt_length: modelConfig.system_prompt.length,
    });
    
    const createResponse = await typesenseApi("POST", "/conversations/models", modelConfig);
    
    console.log(`Create model response: ${createResponse.status}, ok: ${createResponse.ok}`);
    
    if (!createResponse.ok) {
      let errorText: string;
      try {
        const errorJson = await createResponse.json();
        errorText = typeof errorJson === "string" 
          ? errorJson 
          : JSON.stringify(errorJson);
      } catch {
        errorText = await createResponse.text();
      }
      
      const errorMessage = `Failed to create model (${createResponse.status}): ${errorText}`;
      console.error("Model creation failed:", errorMessage);
      console.error("Model config:", { 
        id: modelConfig.id,
        model_name: modelConfig.model_name,
        system_prompt_length: modelConfig.system_prompt.length,
        max_bytes: modelConfig.max_bytes,
        history_collection: modelConfig.history_collection,
        ttl: modelConfig.ttl,
        api_key_set: !!openaiApiKey,
        api_key_length: openaiApiKey?.length || 0,
      });
      
      // Return a more detailed error to the client
      return NextResponse.json(
        { 
          status: "error", 
          detail: errorMessage,
          typesense_status: createResponse.status,
          typesense_error: errorText,
        },
        { status: 500 }
      );
    }

    let newModel: {
      id: string;
      model_name: string;
      system_prompt?: string;
      max_bytes?: number;
      history_collection?: string;
      ttl?: number;
    };
    
    try {
      const responseText = await createResponse.text();
      console.log("Create response text (full):", responseText);
      
      try {
        newModel = JSON.parse(responseText) as typeof newModel;
        console.log("Parsed model from create response:", {
          id: newModel.id,
          model_name: newModel.model_name,
          expected_id: MODEL_ID,
          id_matches: newModel.id === MODEL_ID,
        });
      } catch (parseError) {
        console.error("Failed to parse create response as JSON:", parseError);
        console.error("Full response:", responseText);
        throw new Error(`Failed to parse model creation response: ${responseText}`);
      }
    } catch (error) {
      // If we can't parse the response, the model creation likely failed
      console.error("Error reading create response:", error);
      throw error;
    }
    
    // Verify the model was created with the correct ID
    if (newModel.id !== MODEL_ID) {
      console.error(`CRITICAL: Model ID mismatch! Expected "${MODEL_ID}", but got "${newModel.id}"`);
      console.error("This means Typesense created the model with a different ID than requested.");
      // Still continue, but this is a problem
    }
    
    console.log("Model created successfully:", {
      id: newModel.id,
      model_name: newModel.model_name,
      has_system_prompt: !!newModel.system_prompt,
    });
    
    // Verify the model exists by fetching it (with a delay for Typesense to index)
    // Try multiple times with increasing delays
    let verified = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const delay = attempt * 1000; // 1s, 2s, 3s
      console.log(`Verification attempt ${attempt}/${3} after ${delay}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const verifyResponse = await typesenseApi("GET", `/conversations/models/${MODEL_ID}`);
        if (verifyResponse.ok) {
          const verifiedModel = await verifyResponse.json() as typeof newModel;
          console.log(`✓ Model verified successfully via GET (attempt ${attempt}):`, verifiedModel.id);
          // Use the verified model instead of the creation response
          newModel = verifiedModel;
          verified = true;
          break;
        } else {
          const verifyErrorText = await verifyResponse.text();
          console.warn(`✗ Verification attempt ${attempt} failed (${verifyResponse.status}): ${verifyErrorText}`);
        }
      } catch (verifyError) {
        console.warn(`✗ Verification attempt ${attempt} error:`, verifyError);
      }
    }
    
    if (!verified) {
      console.error("⚠ WARNING: Could not verify model exists after creation. It may take longer to be available.");
      // Also try listing all models to see if it appears with a different ID
      try {
        const listResponse = await typesenseApi("GET", "/conversations/models");
        if (listResponse.ok) {
          const listText = await listResponse.text();
          const allModels = JSON.parse(listText);
          const modelList = Array.isArray(allModels) ? allModels : (allModels.models || []);
          console.log("Available models after creation:", modelList.map((m: { id: string }) => m.id));
          const foundModel = modelList.find((m: { id: string }) => m.id === MODEL_ID || m.id === newModel.id);
          if (foundModel) {
            console.log("Found model in list:", foundModel.id);
          } else {
            console.error("Model not found in list even after creation!");
          }
        }
      } catch (listError) {
        console.error("Could not list models for verification:", listError);
      }
    }
    
    return NextResponse.json({
      status: "ok",
      message: "System prompt updated successfully",
      model: {
        id: newModel.id,
        model_name: newModel.model_name,
        system_prompt: newModel.system_prompt || systemPrompt,
        max_bytes: newModel.max_bytes || 16384,
        history_collection: newModel.history_collection || "job_search_conversations",
        ttl: newModel.ttl || 86400,
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


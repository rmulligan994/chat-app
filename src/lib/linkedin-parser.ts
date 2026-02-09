/**
 * ==========================================================================
 *  LinkedIn Profile PDF Parser — ported from linkedinprofileParser.py
 * ==========================================================================
 *
 *  Extracts text from an uploaded LinkedIn PDF, sends it to OpenAI GPT-4o,
 *  and returns structured profile data as JSON.
 *
 *  Uses direct fetch() to OpenAI API instead of the SDK to keep the bundle
 *  small for Cloudflare Workers.
 *
 *  Used by /app/api/linkedin/parse/route.ts
 */

// --- Types ---
export interface LinkedInProfile {
  name: string | null;
  title: string | null;
  location: string | null;
  contact: {
    email: string | null;
    linkedin: string | null;
    company_website: string | null;
    portfolio: string | null;
    instagram: string | null;
  };
  top_skills: string[];
  languages: string[];
  summary: string | null;
  experience: {
    company: string | null;
    title: string | null;
    duration: string | null;
    location: string | null;
    description: string | null;
  }[];
  education: {
    institution: string | null;
    degree: string | null;
    years: string | null;
  }[];
  honors_awards: string[];
}

/**
 * Extract all text from PDF bytes using pdf-parse.
 * Imports from pdf-parse/lib/pdf-parse.js directly to avoid the
 * top-level `require('fs')` in the package's index.js.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // Import from /lib/pdf-parse directly to skip the index.js that requires 'fs'
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const data = await pdfParse(pdfBuffer);
  return data.text;
}

/**
 * Send raw LinkedIn profile text to OpenAI GPT-4o using direct fetch()
 * (avoids the heavy openai SDK for Cloudflare Workers compatibility).
 */
export async function parseProfileWithOpenAI(
  pdfText: string
): Promise<LinkedInProfile> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Add it to your Webflow Cloud environment variables."
    );
  }

  const prompt = `
Extract the following information from this LinkedIn profile and return it as JSON:

{
    "name": "Full name",
    "title": "Current job title",
    "location": "Location",
    "contact": {
        "email": "email address",
        "linkedin": "LinkedIn URL",
        "company_website": "Company website",
        "portfolio": "Portfolio URL if available",
        "instagram": "Instagram URL if available"
    },
    "top_skills": ["skill1", "skill2"],
    "languages": ["language1", "language2"],
    "summary": "Professional summary text",
    "experience": [
        {
            "company": "Company name",
            "title": "Job title",
            "duration": "Date range",
            "location": "Location if mentioned",
            "description": "Job description/responsibilities"
        }
    ],
    "education": [
        {
            "institution": "School name",
            "degree": "Degree type and field",
            "years": "Years attended"
        }
    ],
    "honors_awards": ["award1", "award2"]
}

If a field is not present in the profile, use null or an empty array.
Return ONLY valid JSON, no additional text.

LinkedIn Profile Text:
${pdfText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a data extraction expert. Extract information from LinkedIn profiles and return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  let jsonText = data.choices[0]?.message?.content?.trim() ?? "{}";

  // Strip markdown code fences if present
  if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
  if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
  if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);

  return JSON.parse(jsonText.trim()) as LinkedInProfile;
}

/**
 * PRIMARY FUNCTION: accepts raw PDF bytes, returns structured profile data.
 */
export async function parseLinkedInPdf(
  pdfBuffer: Buffer
): Promise<LinkedInProfile> {
  const text = await extractTextFromPdf(pdfBuffer);
  return parseProfileWithOpenAI(text);
}

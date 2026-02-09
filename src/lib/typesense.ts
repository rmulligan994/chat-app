/**
 * ==========================================================================
 *  Typesense Job Search — ported from chat-interface.py
 * ==========================================================================
 *
 *  All the Typesense interaction + smart filter extraction lives here.
 *  Used by the API routes in /app/api/job-search/
 */

// --- Config ---
const TYPESENSE_HOST = "ky213smohjuti0gcp-1.a1.typesense.net";
const TYPESENSE_API_KEY = "Pr4OHQj4Y7Vu0F0iiUDrVzAvVLGiN0a3";
const COLLECTION_NAME = "jobs_v2";
const MODEL_ID = "job-search-assistant";

// --- US state mappings (resolves "florida" → "FL") ---
const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT",
  delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI",
  idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME",
  maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH",
  "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

const ABBREV_TO_NAME: Record<string, string> = {};
for (const [name, abbrev] of Object.entries(US_STATES)) {
  ABBREV_TO_NAME[abbrev] = name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// --- Aliases so users can type "full time" or "ft" and we match the DB value ---
const JOBTYPE_ALIASES: Record<string, string[]> = {
  "full-time": ["full time", "fulltime", "ft"],
  "part-time": ["part time", "parttime", "pt"],
  prn: ["per diem", "as needed"],
  contract: ["contractor", "temp", "temporary"],
};

const REMOTETYPE_ALIASES: Record<string, string[]> = {
  remote: ["work from home", "wfh", "telecommute", "virtual"],
  hybrid: ["flex", "flexible"],
  onsite: ["on-site", "in-person", "in person", "on site", "in office"],
};

// --- Types ---
export interface FilterOptions {
  states: string[];
  jobtypes: string[];
  remotetypes: string[];
  categories: string[];
}

export interface ExtractedFilters {
  state?: string;
  jobtype?: string;
  remotetype?: string;
  category?: string;
}

export interface ChatOptions {
  /** Override per_page (number of jobs in context) */
  perPage?: number;
  /** Custom system prompt prepended to the user message */
  systemPrompt?: string;
  /** Override collection name */
  collectionName?: string;
  /** Override conversation model ID */
  modelId?: string;
  /** Default filters from settings (merged with query-detected filters) */
  defaultFilters?: {
    state?: string;
    jobtype?: string;
    remotetype?: string;
    category?: string;
  };
}

export interface ChatResult {
  answer: string;
  conversation_id: string | null;
  jobs_found: number;
  hits: unknown[];
  filters_applied: ExtractedFilters;
  filters_display: string | null;
  filter_by: string | null;
  /** The raw request that was sent to Typesense (for debug panel) */
  debug: {
    searchParams: unknown;
    queryParams: Record<string, string>;
    effectiveMessage: string;
  };
}

// --- In-memory cache of filter options loaded from Typesense ---
const filterOptions: FilterOptions = {
  states: [],
  jobtypes: [],
  remotetypes: [],
  categories: [],
};

// --- Typesense API helper ---
async function typesenseApi(
  method: string,
  endpoint: string,
  body?: unknown,
  params?: Record<string, string>
): Promise<Record<string, unknown>> {
  const url = new URL(`https://${TYPESENSE_HOST}:443${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

// =====================================================================
//  PUBLIC FUNCTIONS (used by API routes)
// =====================================================================

/**
 * Load all available filter values from Typesense via faceting.
 * Call once on startup or when the user wants to refresh.
 */
export async function initializeJobSearch(): Promise<FilterOptions> {
  const result = await typesenseApi("POST", "/multi_search", {
    searches: [
      {
        collection: COLLECTION_NAME,
        q: "*",
        query_by: "title",
        facet_by: "state,jobtype,remotetype,category",
        max_facet_values: 100,
        per_page: 0,
        prefix: "false",
      },
    ],
  });

  const facets = (result as Record<string, unknown[]> & { results?: { facet_counts?: { field_name: string; counts?: { value: string }[] }[] }[] })?.results?.[0]?.facet_counts ?? [];

  for (const facet of facets) {
    const field = facet.field_name;
    const values = (facet.counts ?? [])
      .filter((v: { value: string }) => v.value)
      .map((v: { value: string }) => v.value);

    if (field === "state") filterOptions.states = values;
    else if (field === "jobtype") filterOptions.jobtypes = values;
    else if (field === "remotetype") filterOptions.remotetypes = values;
    else if (field === "category") filterOptions.categories = values;
  }

  console.log(`✓ States: ${filterOptions.states.length} loaded`);
  console.log(`✓ Job Types: ${filterOptions.jobtypes}`);
  console.log(`✓ Remote Types: ${filterOptions.remotetypes}`);
  console.log(`✓ Categories: ${filterOptions.categories.length} options`);

  return filterOptions;
}

/** Return the cached filter options (for UI dropdowns). */
export function getFilterOptions(): FilterOptions {
  return filterOptions;
}

// --- Internal: fuzzy-match a query fragment against known DB values + aliases ---
function findMatchInDbValues(
  queryLower: string,
  dbValues: string[],
  aliases?: Record<string, string[]>
): string | null {
  // Direct substring match
  for (const dbValue of dbValues) {
    if (queryLower.includes(dbValue.toLowerCase())) return dbValue;
  }

  // Alias match
  if (aliases) {
    for (const [dbPattern, aliasList] of Object.entries(aliases)) {
      if (queryLower.includes(dbPattern)) {
        for (const dbValue of dbValues) {
          if (
            dbValue.toLowerCase() === dbPattern ||
            dbValue.toLowerCase().includes(dbPattern)
          )
            return dbValue;
        }
      }
      for (const alias of aliasList) {
        if (queryLower.includes(alias)) {
          const normPattern = dbPattern.replace(/-/g, "").replace(/ /g, "");
          for (const dbValue of dbValues) {
            const normValue = dbValue.toLowerCase().replace(/-/g, "").replace(/ /g, "");
            if (normValue.includes(normPattern)) return dbValue;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Parse a natural-language query and extract filterable criteria.
 * Detects state names/abbreviations, job types, remote types, and categories.
 */
export function extractFilters(query: string): ExtractedFilters {
  const queryLower = query.toLowerCase();
  const filters: ExtractedFilters = {};

  // Match full state names → abbreviation
  for (const [stateName, abbrev] of Object.entries(US_STATES)) {
    if (queryLower.includes(stateName)) {
      if (filterOptions.states.includes(abbrev)) {
        filters.state = abbrev;
        break;
      }
    }
  }

  // Match uppercase abbreviations typed directly (case-sensitive)
  if (!filters.state) {
    for (const abbrev of filterOptions.states) {
      const regex = new RegExp(`\\b${abbrev}\\b`); // case-sensitive
      if (regex.test(query)) {
        filters.state = abbrev;
        break;
      }
    }
  }

  // Job type
  const jobtypeMatch = findMatchInDbValues(queryLower, filterOptions.jobtypes, JOBTYPE_ALIASES);
  if (jobtypeMatch) filters.jobtype = jobtypeMatch;

  // Remote type
  const remotetypeMatch = findMatchInDbValues(queryLower, filterOptions.remotetypes, REMOTETYPE_ALIASES);
  if (remotetypeMatch) filters.remotetype = remotetypeMatch;

  // Category
  const categoryMatch = findMatchInDbValues(queryLower, filterOptions.categories);
  if (categoryMatch) filters.category = categoryMatch;

  return filters;
}

/** Build a Typesense filter_by string from extracted filters. */
function buildFilterBy(filters: ExtractedFilters): string | null {
  const clauses: string[] = [];
  if (filters.state) clauses.push(`state:=${filters.state}`);
  if (filters.jobtype) clauses.push(`jobtype:=\`${filters.jobtype}\``);
  if (filters.remotetype) clauses.push(`remotetype:=\`${filters.remotetype}\``);
  if (filters.category) clauses.push(`category:=\`${filters.category}\``);
  return clauses.length > 0 ? clauses.join(" && ") : null;
}

/** Create a user-friendly string showing active filters. */
export function formatFiltersDisplay(filters: ExtractedFilters): string | null {
  if (!filters.state && !filters.jobtype && !filters.remotetype && !filters.category) {
    return null;
  }

  const parts: string[] = [];
  if (filters.state) {
    const fullName = ABBREV_TO_NAME[filters.state] ?? filters.state;
    parts.push(`📍 ${fullName} (${filters.state})`);
  }
  if (filters.jobtype) parts.push(`💼 ${filters.jobtype}`);
  if (filters.remotetype) parts.push(`🏠 ${filters.remotetype}`);
  if (filters.category) parts.push(`📂 ${filters.category}`);

  return parts.join(" • ");
}

/**
 * Send a natural-language message to the Typesense conversational search.
 * Auto-detects filters from the message. Accepts optional settings overrides.
 */
export async function jobSearchChat(
  userMessage: string,
  conversationId?: string | null,
  options?: ChatOptions
): Promise<ChatResult> {
  const perPage = options?.perPage ?? 100;
  const collectionName = options?.collectionName || COLLECTION_NAME;
  const modelId = options?.modelId || MODEL_ID;

  // Step 1: Auto-detect filters from the message
  const detectedFilters = extractFilters(userMessage);

  // Merge with default filters from settings (detected filters take priority)
  const filters: ExtractedFilters = { ...detectedFilters };
  if (options?.defaultFilters) {
    if (options.defaultFilters.state && !filters.state)
      filters.state = options.defaultFilters.state;
    if (options.defaultFilters.jobtype && !filters.jobtype)
      filters.jobtype = options.defaultFilters.jobtype;
    if (options.defaultFilters.remotetype && !filters.remotetype)
      filters.remotetype = options.defaultFilters.remotetype;
    if (options.defaultFilters.category && !filters.category)
      filters.category = options.defaultFilters.category;
  }

  const filterBy = buildFilterBy(filters);
  const filtersDisplay = formatFiltersDisplay(filters);

  // Step 2: Prepend system prompt to the message if configured
  const effectiveMessage = options?.systemPrompt
    ? `[Context: ${options.systemPrompt}]\n\n${userMessage}`
    : userMessage;

  // Step 3: Build request
  const queryParams: Record<string, string> = {
    q: effectiveMessage,
    conversation: "true",
    conversation_model_id: modelId,
  };
  if (conversationId) queryParams.conversation_id = conversationId;

  const searchParams: Record<string, unknown> = {
    collection: collectionName,
    query_by: "embedding",
    exclude_fields: "embedding",
    prefix: "false",
    per_page: perPage,
  };
  if (filterBy) searchParams.filter_by = filterBy;

  // Step 4: Execute
  const result = await typesenseApi(
    "POST",
    "/multi_search",
    { searches: [searchParams] },
    queryParams
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultAny = result as any;
  const conversationData = resultAny?.conversation ?? {};
  const searchResults = resultAny?.results?.[0] ?? {};

  return {
    answer: (conversationData.answer as string) ?? "Sorry, I couldn't generate a response.",
    conversation_id: (conversationData.conversation_id as string) ?? null,
    jobs_found: (searchResults.found as number) ?? 0,
    hits: (searchResults.hits as unknown[]) ?? [],
    filters_applied: filters,
    filters_display: filtersDisplay,
    filter_by: filterBy,
    debug: {
      searchParams,
      queryParams,
      effectiveMessage,
    },
  };
}


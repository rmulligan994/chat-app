/**
 * ==========================================================================
 *  App Settings — types, defaults, and localStorage persistence
 * ==========================================================================
 *
 *  These settings let users configure the Typesense search behavior,
 *  system prompt, job context size, default filters, etc.
 */

export interface AppSettings {
  /** How many jobs to include in the AI's context window (Typesense per_page) */
  perPage: number;

  /**
   * Custom system prompt prepended to every chat message.
   * This guides the AI's behavior — e.g. "Only recommend full-time roles"
   */
  systemPrompt: string;

  /** Default filters applied to every search (user can override per-message) */
  defaultFilters: {
    state: string;
    jobtype: string;
    remotetype: string;
    category: string;
  };

  /** Show the raw Typesense request/response in the chat for debugging */
  showDebug: boolean;

  /** Typesense collection name */
  collectionName: string;

  /** Typesense conversation model ID */
  modelId: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  perPage: 100,
  systemPrompt: "",
  defaultFilters: {
    state: "",
    jobtype: "",
    remotetype: "",
    category: "",
  },
  showDebug: false,
  collectionName: "jobs_v2",
  modelId: "job-search-assistant",
};

const STORAGE_KEY = "brightspring-settings";

/** Load settings from localStorage (falls back to defaults). */
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Save settings to localStorage. */
export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}


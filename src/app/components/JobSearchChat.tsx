"use client";

import { useState, useRef, useEffect } from "react";
import type { AppSettings } from "@/lib/settings";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface DebugInfo {
  searchParams: unknown;
  queryParams: Record<string, string>;
  effectiveMessage: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  jobsFound?: number;
  filtersDisplay?: string | null;
  debug?: DebugInfo;
}

interface Props {
  settings: AppSettings;
  /** If set, auto-send this message on mount (used by LinkedIn → Jobs flow) */
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
}

export default function JobSearchChat({
  settings,
  initialMessage,
  onInitialMessageSent,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send initial message (from LinkedIn parser)
  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initialMessage);
      onInitialMessageSent?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${basePath}/api/job-search/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          settings: {
            perPage: settings.perPage,
            systemPrompt: settings.systemPrompt || undefined,
            collectionName: settings.collectionName,
            modelId: settings.modelId,
            defaultFilters: settings.defaultFilters,
          },
        }),
      });
      const data = (await res.json()) as {
        conversation_id?: string;
        answer?: string;
        jobs_found?: number;
        filters_display?: string | null;
        debug?: DebugInfo;
      };

      setConversationId(data.conversation_id ?? null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer ?? "",
          jobsFound: data.jobs_found,
          filtersDisplay: data.filters_display,
          debug: data.debug,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim());

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    initialSent.current = false;
    fetch(`${basePath}/api/job-search/initialize`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* ---- Chat messages ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-24 space-y-2">
            <p className="text-4xl">💬</p>
            <p className="text-lg font-medium">Job Search Assistant</p>
            <p className="text-sm">
              Ask me about jobs — try &quot;RN jobs in Florida&quot; or
              &quot;part-time remote positions&quot;
            </p>
            {settings.systemPrompt && (
              <p className="text-xs bg-gray-100 inline-block px-3 py-1 rounded-full mt-2">
                🧠 Custom prompt active
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                }`}
              >
                {/* Filter pills */}
                {msg.filtersDisplay && (
                  <div className="text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-3 py-1 mb-2 inline-block">
                    {msg.filtersDisplay}
                  </div>
                )}

                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.text}
                </p>

                {/* Jobs found badge */}
                {msg.jobsFound !== undefined && (
                  <p className="text-xs mt-2 opacity-60">
                    {msg.jobsFound} jobs found
                  </p>
                )}
              </div>
            </div>

            {/* Debug panel */}
            {settings.showDebug && msg.debug && (
              <div className="mt-2 ml-0 max-w-[90%]">
                <details className="group">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    🔍 Debug: Typesense Request
                  </summary>
                  <div className="mt-2 bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto space-y-3">
                    <div>
                      <span className="text-gray-500">
                        {/* Effective message sent */}
                        {"// Effective message sent"}
                      </span>
                      <pre className="whitespace-pre-wrap text-yellow-300 mt-1">
                        {msg.debug.effectiveMessage}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-500">{"// Query params"}</span>
                      <pre className="whitespace-pre-wrap mt-1">
                        {JSON.stringify(msg.debug.queryParams, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-500">{"// Search params"}</span>
                      <pre className="whitespace-pre-wrap mt-1">
                        {JSON.stringify(msg.debug.searchParams, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ---- Input bar ---- */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button
            onClick={handleNewConversation}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition shrink-0"
            title="New conversation"
          >
            ✨ New
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Search for jobs..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


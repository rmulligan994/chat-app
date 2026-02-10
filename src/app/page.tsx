"use client";

import { useEffect, useState, useCallback } from "react";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/settings";
import JobSearchChat from "./components/JobSearchChat";
import LinkedInParser from "./components/LinkedInParser";
import SettingsPanel from "./components/SettingsPanel";
import SystemPromptPanel from "./components/SystemPromptPanel";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

type Tab = "chat" | "linkedin" | "settings" | "system-prompt";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [settings, setSettings] = useState<AppSettings | null>(null);

  /**
   * When LinkedInParser generates a job query, we store it here,
   * switch to the chat tab, and the chat component auto-sends it.
   */
  const [pendingJobQuery, setPendingJobQuery] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Initialize job search filters on first load
  useEffect(() => {
    fetch(`${basePath}/api/job-search/initialize`, { method: "POST" }).catch(() => {});
  }, []);

  // Persist settings on every change
  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // LinkedIn → Chat bridge
  const handleFindJobs = useCallback((query: string) => {
    setPendingJobQuery(query);
    setActiveTab("chat");
  }, []);

  // Don't render until settings are loaded from localStorage
  if (!settings) return null;

  return (
    <>
      {/* ---- Top nav ---- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
          <span className="text-lg font-bold text-blue-600 mr-8 shrink-0">
            BrightSpring Tools
          </span>

          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "chat"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              💬 Job Search
            </button>
            <button
              onClick={() => setActiveTab("linkedin")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "linkedin"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              📄 LinkedIn Parser
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "settings"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => setActiveTab("system-prompt")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "system-prompt"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              🤖 System Prompt
            </button>
          </nav>
        </div>
      </header>

      {/* ---- Main content ---- */}
      <main className="flex-1">
        {activeTab === "chat" && (
          <JobSearchChat
            settings={settings}
            initialMessage={pendingJobQuery}
            onInitialMessageSent={() => setPendingJobQuery(null)}
          />
        )}
        {activeTab === "linkedin" && (
          <LinkedInParser onFindJobs={handleFindJobs} />
        )}
        {activeTab === "settings" && (
          <SettingsPanel settings={settings} onChange={handleSettingsChange} />
        )}
        {activeTab === "system-prompt" && <SystemPromptPanel />}
      </main>
    </>
  );
}

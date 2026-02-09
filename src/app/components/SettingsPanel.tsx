"use client";

import { useState, useEffect } from "react";
import type { AppSettings } from "@/lib/settings";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface FilterOptions {
  states: string[];
  jobtypes: string[];
  remotetypes: string[];
  categories: string[];
}

interface Props {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const [filters, setFilters] = useState<FilterOptions>({
    states: [],
    jobtypes: [],
    remotetypes: [],
    categories: [],
  });

  // Fetch available filter options for the dropdowns
  useEffect(() => {
    fetch(`${basePath}/api/job-search/filters`)
      .then((r) => r.json() as Promise<FilterOptions>)
      .then((data) => setFilters(data))
      .catch(() => {});
  }, []);

  const update = (patch: Partial<AppSettings>) => {
    onChange({ ...settings, ...patch });
  };

  const updateDefaultFilter = (
    key: keyof AppSettings["defaultFilters"],
    value: string
  ) => {
    onChange({
      ...settings,
      defaultFilters: { ...settings.defaultFilters, [key]: value },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold">⚙️ Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the job search assistant behavior. Changes are saved
          automatically to your browser.
        </p>
      </div>

      {/* ---- Search Behavior ---- */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Search Behavior</h3>

        {/* Per Page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jobs in Context
            <span className="font-normal text-gray-400 ml-1">
              (per_page sent to Typesense)
            </span>
          </label>
          <input
            type="number"
            min={1}
            max={250}
            value={settings.perPage}
            onChange={(e) =>
              update({ perPage: Math.max(1, parseInt(e.target.value) || 100) })
            }
            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            How many job results the AI sees when forming its answer (1–250).
            Higher = more comprehensive but slower.
          </p>
        </div>

        {/* Collection Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Collection Name
          </label>
          <input
            type="text"
            value={settings.collectionName}
            onChange={(e) => update({ collectionName: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Model ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conversation Model ID
          </label>
          <input
            type="text"
            value={settings.modelId}
            onChange={(e) => update({ modelId: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      {/* ---- System Prompt ---- */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">System Prompt</h3>
        <p className="text-xs text-gray-400">
          This text is prepended to every user message as context for the AI.
          Use it to shape the assistant&apos;s behavior — e.g. &quot;Only
          recommend full-time clinical roles&quot; or &quot;Always include salary
          range if available.&quot;
        </p>
        <textarea
          value={settings.systemPrompt}
          onChange={(e) => update({ systemPrompt: e.target.value })}
          rows={4}
          placeholder="e.g. You are a helpful BrightSpring recruiter. Focus on clinical and healthcare roles. Always mention the job location and type."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </section>

      {/* ---- Default Filters ---- */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800">Default Filters</h3>
          <p className="text-xs text-gray-400 mt-1">
            These filters are applied to every search automatically. Users can
            still override them by mentioning a specific state or job type in
            their message.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={settings.defaultFilters.state}
              onChange={(e) => updateDefaultFilter("state", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any state</option>
              {filters.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              value={settings.defaultFilters.jobtype}
              onChange={(e) => updateDefaultFilter("jobtype", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any type</option>
              {filters.jobtypes.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Remote Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remote Type
            </label>
            <select
              value={settings.defaultFilters.remotetype}
              onChange={(e) => updateDefaultFilter("remotetype", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              {filters.remotetypes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={settings.defaultFilters.category}
              onChange={(e) => updateDefaultFilter("category", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any category</option>
              {filters.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ---- Debug Toggle ---- */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showDebug}
            onChange={(e) => update({ showDebug: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-800">
              Show Debug Panel
            </span>
            <p className="text-xs text-gray-400">
              Display the raw Typesense request &amp; response under each chat
              message — useful for seeing exactly what filters and params are
              being sent.
            </p>
          </div>
        </label>
      </section>
    </div>
  );
}


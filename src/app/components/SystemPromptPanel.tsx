"use client";

import { useState, useEffect } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface ModelInfo {
  id: string;
  model_name: string;
  system_prompt: string;
  max_bytes: number;
  history_collection: string;
  ttl: number;
}

export default function SystemPromptPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [defaultPrompt, setDefaultPrompt] = useState<string>("");
  const [editedPrompt, setEditedPrompt] = useState<string>("");

  // Load current model and default prompt
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/system-prompt`);
      const data = (await res.json()) as {
        status: string;
        model?: ModelInfo;
        default_prompt?: string;
        detail?: string;
      };

      if (!res.ok || data.status !== "ok") {
        throw new Error(data.detail || "Failed to load model");
      }

      if (data.model) {
        setCurrentModel(data.model);
        setEditedPrompt(data.model.system_prompt);
      }
      if (data.default_prompt) {
        setDefaultPrompt(data.default_prompt);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load model";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedPrompt.trim()) {
      setError("System prompt cannot be empty");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${basePath}/api/system-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_prompt: editedPrompt }),
      });

      const data = (await res.json()) as {
        status: string;
        message?: string;
        detail?: string;
      };

      if (!res.ok || data.status !== "ok") {
        throw new Error(data.detail || "Failed to update system prompt");
      }

      setSuccess(data.message || "System prompt updated successfully!");
      // Reload to get the updated model
      await loadModel();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update system prompt";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!defaultPrompt) {
      setError("Default prompt not loaded");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${basePath}/api/system-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_default: true }),
      });

      const data = (await res.json()) as {
        status: string;
        message?: string;
        detail?: string;
      };

      if (!res.ok || data.status !== "ok") {
        throw new Error(data.detail || "Failed to reset system prompt");
      }

      setSuccess(data.message || "System prompt reset to default!");
      // Reload to get the updated model
      await loadModel();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset system prompt";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Loading system prompt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">System Prompt</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the AI assistant's behavior and instructions
          </p>
        </div>

        {/* Model Info */}
        {currentModel && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Model ID:</span>
                <span className="ml-2 font-mono text-gray-900">{currentModel.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Model Name:</span>
                <span className="ml-2 font-mono text-gray-900">{currentModel.model_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Max Bytes:</span>
                <span className="ml-2 text-gray-900">{currentModel.max_bytes.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">TTL:</span>
                <span className="ml-2 text-gray-900">{currentModel.ttl / 3600}h</span>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Editor */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter system prompt..."
              />
              <p className="mt-2 text-xs text-gray-500">
                {editedPrompt.length.toLocaleString()} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving || editedPrompt.trim() === currentModel?.system_prompt}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleResetToDefault}
                disabled={saving || !defaultPrompt}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Return to Default
              </button>
              <button
                onClick={loadModel}
                disabled={saving}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Reload
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="px-6 py-4 bg-blue-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Changes are applied by deleting and recreating the model (Typesense doesn't support in-place updates)</li>
                <li>The model ID remains the same, so existing conversations will continue to work</li>
                <li>Changes take effect immediately for new conversations</li>
                <li>Use "Return to Default" to restore the original prompt from ragexperients.py</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


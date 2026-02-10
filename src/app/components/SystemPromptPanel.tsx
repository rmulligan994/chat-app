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

interface ModelListItem {
  id: string;
  model_name: string;
}

// localStorage key for model names mapping
const MODEL_NAMES_KEY = "typesense_model_names";
const SELECTED_MODEL_KEY = "typesense_selected_model";

// Helper functions for localStorage
function getModelNames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(MODEL_NAMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveModelName(uuid: string, name: string): void {
  if (typeof window === "undefined") return;
  try {
    const names = getModelNames();
    names[uuid] = name;
    localStorage.setItem(MODEL_NAMES_KEY, JSON.stringify(names));
  } catch (err) {
    console.error("Failed to save model name:", err);
  }
}

function getSelectedModelId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SELECTED_MODEL_KEY);
  } catch {
    return null;
  }
}

function saveSelectedModelId(uuid: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELECTED_MODEL_KEY, uuid);
  } catch (err) {
    console.error("Failed to save selected model:", err);
  }
}

export default function SystemPromptPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [allModels, setAllModels] = useState<ModelListItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [defaultPrompt, setDefaultPrompt] = useState<string>("");
  const [editedPrompt, setEditedPrompt] = useState<string>("");

  // Load all models and selected model on mount
  useEffect(() => {
    loadAllModels();
    const savedId = getSelectedModelId();
    if (savedId) {
      setSelectedModelId(savedId);
      loadModel(savedId);
    } else {
      loadModel(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load model when selection changes
  useEffect(() => {
    if (selectedModelId) {
      loadModel(selectedModelId);
    } else {
      setCurrentModel(null);
      setEditedPrompt(defaultPrompt);
    }
  }, [selectedModelId, defaultPrompt]);

  const loadAllModels = async () => {
    try {
      const res = await fetch(`${basePath}/api/system-prompt?list=true`);
      const data = (await res.json()) as {
        status: string;
        models?: ModelListItem[];
        detail?: string;
      };

      if (data.status === "ok" && data.models) {
        setAllModels(data.models);
        // If no model is selected, select the first one
        if (!selectedModelId && data.models.length > 0) {
          const firstId = data.models[0].id;
          setSelectedModelId(firstId);
          saveSelectedModelId(firstId);
        }
      }
    } catch (err) {
      console.error("Failed to load models list:", err);
    }
  };

  const loadModel = async (modelId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = modelId
        ? `${basePath}/api/system-prompt?modelId=${encodeURIComponent(modelId)}`
        : `${basePath}/api/system-prompt`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        status: string;
        model?: ModelInfo;
        default_prompt?: string;
        detail?: string;
      };

      if (!res.ok || data.status !== "ok") {
        // If model doesn't exist (404), that's OK - we'll show a create button
        if (res.status === 404) {
          setError(null); // Clear error for 404
          if (data.default_prompt) {
            setDefaultPrompt(data.default_prompt);
            setEditedPrompt(data.default_prompt);
          }
          setCurrentModel(null);
          return;
        }
        throw new Error(data.detail || "Failed to load model");
      }

      if (data.model) {
        setCurrentModel(data.model);
        setEditedPrompt(data.model.system_prompt);
        // Load saved name for this model
        const names = getModelNames();
        setModelName(names[data.model.id] || "");
      }
      if (data.default_prompt) {
        setDefaultPrompt(data.default_prompt);
        // If no model exists, initialize editor with default prompt
        if (!data.model) {
          setEditedPrompt(data.default_prompt);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load model";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (uuid: string) => {
    setSelectedModelId(uuid);
    saveSelectedModelId(uuid);
    setError(null);
    setSuccess(null);
  };

  const handleSaveName = () => {
    if (selectedModelId && modelName.trim()) {
      saveModelName(selectedModelId, modelName.trim());
      setEditingName(false);
      setSuccess("Model name saved!");
      setTimeout(() => setSuccess(null), 2000);
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
        body: JSON.stringify({
          system_prompt: editedPrompt,
          modelId: selectedModelId || undefined, // Include UUID if updating existing model
        }),
      });

      const data = (await res.json()) as {
        status: string;
        message?: string;
        detail?: string;
        typesense_status?: number;
        typesense_error?: string;
        model?: ModelInfo;
      };

      if (!res.ok || data.status !== "ok") {
        let errorMsg = data.detail || "Failed to update system prompt";
        if (data.typesense_error) {
          errorMsg += `\n\nTypesense Error (${data.typesense_status}): ${data.typesense_error}`;
        }
        throw new Error(errorMsg);
      }

      setSuccess(data.message || "System prompt updated successfully!");
      
      if (data.model) {
        // Use the model from response immediately
        setCurrentModel(data.model);
        setEditedPrompt(data.model.system_prompt || editedPrompt);
        
        // If this is a new model (UUID), update selection and reload models list
        if (!selectedModelId || selectedModelId !== data.model.id) {
          setSelectedModelId(data.model.id);
          saveSelectedModelId(data.model.id);
          await loadAllModels();
        }
        
        // Reload after a delay to ensure Typesense has indexed it
        setTimeout(() => {
          loadModel(data.model!.id).catch(console.error);
        }, 1000);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (selectedModelId) {
          await loadModel(selectedModelId);
        }
      }
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
        body: JSON.stringify({
          use_default: true,
          modelId: selectedModelId || undefined,
        }),
      });

      const data = (await res.json()) as {
        status: string;
        message?: string;
        detail?: string;
        typesense_error?: string;
        model?: ModelInfo;
      };

      if (!res.ok || data.status !== "ok") {
        let errorMsg = data.detail || "Failed to reset system prompt";
        if (data.typesense_error) {
          errorMsg += `\n\nTypesense Error: ${data.typesense_error}`;
        }
        throw new Error(errorMsg);
      }

      setSuccess(data.message || "System prompt reset to default!");
      if (data.model) {
        setCurrentModel(data.model);
        setEditedPrompt(data.model.system_prompt || defaultPrompt);
        if (!selectedModelId || selectedModelId !== data.model.id) {
          setSelectedModelId(data.model.id);
          saveSelectedModelId(data.model.id);
          await loadAllModels();
        }
        setTimeout(() => {
          loadModel(data.model!.id).catch(console.error);
        }, 1000);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (selectedModelId) {
          await loadModel(selectedModelId);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset system prompt";
      setError(message);
    } finally {
      setSaving(false);
    }
  };


  const modelNames = getModelNames();
  const getModelDisplayName = (uuid: string) => {
    return modelNames[uuid] || `${uuid.substring(0, 8)}...`;
  };

  if (loading && !currentModel) {
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
            Configure the AI assistant&apos;s behavior and instructions
          </p>
        </div>

        {/* Model Selection */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Model:</label>
            <select
              value={selectedModelId || ""}
              onChange={(e) => handleModelSelect(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Create New Model --</option>
              {allModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {getModelDisplayName(model.id)} ({model.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
            <button
              onClick={loadAllModels}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {/* Model Name Editor */}
          {selectedModelId && (
            <div className="mt-3 flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Enter model name..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setModelName(modelNames[selectedModelId] || "");
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setModelName(modelNames[selectedModelId] || "");
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    Name: <span className="font-medium">{modelName || "Unnamed"}</span>
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Model Info or Missing Model Warning */}
        {currentModel ? (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Model ID:</span>
                <span className="ml-2 font-mono text-gray-900 text-xs">{currentModel.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Model Name:</span>
                <span className="ml-2 font-mono text-gray-900">{currentModel.model_name}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">No Model Selected</p>
                <p className="text-yellow-700">
                  {selectedModelId
                    ? "The selected model doesn&apos;t exist. Create a new one below."
                    : "Select a model from the dropdown above, or create a new one."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-line">
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
                readOnly={false}
              />
              <p className="mt-2 text-xs text-gray-500">
                {editedPrompt.length.toLocaleString()} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {currentModel ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || editedPrompt.trim() === currentModel.system_prompt}
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
                </>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !editedPrompt.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Creating..." : "Create Model"}
                </button>
              )}
              <button
                onClick={() => loadModel(selectedModelId)}
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
                <li>Select a model from the dropdown or create a new one</li>
                <li>Name your models for easy identification (stored in browser)</li>
                <li>Changes are applied by deleting and recreating the model</li>
                <li>New models get UUIDs automatically from Typesense</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

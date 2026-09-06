"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchModels } from "@/lib/api/client";
import type { ModelItem } from "@/lib/types/api";

type ModelsState = {
  models: ModelItem[];
  selectedModel: string;
  activeModel: string | null;
  loading: boolean;
  error: string | null;
  setSelectedModel: (name: string) => void;
  refresh: () => Promise<void>;
};

export function useModels(): ModelsState {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchModels();
      setModels(data.models);
      setActiveModel(data.active_model);

      setSelectedModel((prev) => {
        if (prev && data.models.some((m) => m.name === prev)) return prev;
        if (
          data.active_model &&
          data.models.some((m) => m.name === data.active_model)
        ) {
          return data.active_model;
        }
        return data.models[0]?.name ?? "";
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Failed to load models";
      const offline =
        raw === "Failed to fetch" || raw.toLowerCase().includes("failed to fetch");
      setError(
        offline
          ? "Backend is not running. From the AURA project root run: python server.py"
          : raw,
      );
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    models,
    selectedModel,
    activeModel,
    loading,
    error,
    setSelectedModel,
    refresh,
  };
}

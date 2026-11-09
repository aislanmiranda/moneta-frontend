import { useCallback, useEffect, useState } from "react";
import type { Module } from "../types";
import { modulesApi } from "./client";

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await modulesApi.list();
      setModules(result);
    } catch {
      setError("Não foi possível carregar os módulos. A API está rodando?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { modules, loading, error, refetch };
}

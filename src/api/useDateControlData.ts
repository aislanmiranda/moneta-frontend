import { useCallback, useEffect, useState } from "react";
import type { DateControlEntry, DateControlParty, DateControlSource, IconOption } from "../types";
import { dateControlCategoriesApi, dateControlEntriesApi, dateControlPartiesApi, dateControlSourcesApi } from "./client";

export function useDateControlData(moduleId: string) {
  const [parties, setParties] = useState<DateControlParty[]>([]);
  const [sources, setSources] = useState<DateControlSource[]>([]);
  const [categories, setCategories] = useState<IconOption[]>([]);
  const [entries, setEntries] = useState<DateControlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partiesResult, sourcesResult, entriesResult, categoriesResult] = await Promise.all([
        dateControlPartiesApi.list(moduleId),
        dateControlSourcesApi.list(moduleId),
        dateControlEntriesApi.list(moduleId),
        dateControlCategoriesApi.list(moduleId),
      ]);
      setParties(partiesResult);
      setCategories(categoriesResult);
      setSources(sourcesResult);
      setEntries(entriesResult);
    } catch {
      setError("Não foi possível carregar os dados. A API está rodando?");
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { parties, sources, categories, entries, loading, error, refetch };
}

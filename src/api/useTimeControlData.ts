import { useCallback, useEffect, useState } from "react";
import type { IconOption, TimeControlItem, TimeControlOccurrence, TimeControlParty } from "../types";
import { timeControlItemsApi, timeControlOccurrencesApi, timeControlPartiesApi, timeControlTypesApi } from "./client";

export function useTimeControlData(moduleId: string) {
  const [parties, setParties] = useState<TimeControlParty[]>([]);
  const [items, setItems] = useState<TimeControlItem[]>([]);
  const [types, setTypes] = useState<IconOption[]>([]);
  const [occurrences, setOccurrences] = useState<TimeControlOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partiesResult, itemsResult, occurrencesResult, typesResult] = await Promise.all([
        timeControlPartiesApi.list(moduleId),
        timeControlItemsApi.list(moduleId),
        timeControlOccurrencesApi.list(moduleId),
        timeControlTypesApi.list(moduleId),
      ]);
      setParties(partiesResult);
      setTypes(typesResult);
      setItems(itemsResult);
      setOccurrences(occurrencesResult);
    } catch {
      setError("Não foi possível carregar os dados de saúde. A API está rodando?");
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { parties, items, types, occurrences, loading, error, refetch };
}

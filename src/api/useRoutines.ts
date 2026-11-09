import { useCallback, useEffect, useState } from "react";
import type { Routine } from "../types";
import { routinesApi } from "./client";

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoutines(await routinesApi.list());
    } catch {
      setError("Não foi possível carregar as rotinas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { routines, loading, error, refetch };
}

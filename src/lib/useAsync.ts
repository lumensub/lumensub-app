"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Run an async loader on mount and whenever `deps` change. Results from a
 * stale run are dropped, so fast navigation can't show the wrong data.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const run = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++run.current;
    setLoading(true);
    setError(undefined);
    load()
      .then((value) => {
        if (id === run.current) setData(value);
      })
      .catch((err: unknown) => {
        if (id === run.current) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (id === run.current) setLoading(false);
      });
  }, [load, enabled, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading, reload };
}

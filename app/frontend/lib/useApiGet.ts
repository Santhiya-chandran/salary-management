import { useEffect, useState } from "react";
import { apiGet, buildQuery, type QueryParams } from "./api";

type State<T> = {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
};

// Loads `path` with `params` and reloads whenever they change. Keeps the
// previous data on screen while the next request is in flight, and aborts
// the previous request so a slow, out-of-date response can never overwrite
// a newer one.
export function useApiGet<T>(path: string, params: QueryParams = {}): State<T> {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: true });
  const requestKey = `${path}${buildQuery(params)}`;

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ data: previous.data, error: undefined, loading: true }));

    apiGet<T>(path, params, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: undefined, loading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setState({ data: undefined, error: message, loading: false });
      });

    return () => controller.abort();
    // requestKey captures path and params; params is a new object each render.
  }, [requestKey]);

  return state;
}

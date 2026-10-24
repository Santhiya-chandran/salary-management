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
// a newer one. Pass `null` as the path to load nothing (yet).
export function useApiGet<T>(path: string | null, params: QueryParams = {}): State<T> {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: path !== null });
  const requestKey = path === null ? null : `${path}${buildQuery(params)}`;

  useEffect(() => {
    if (path === null) {
      setState({ data: undefined, error: undefined, loading: false });
      return;
    }
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

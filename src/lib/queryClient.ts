import { QueryClient } from '@tanstack/react-query';

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Query exceeded timeout of ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps an async fetcher with a hard timeout. If the fetcher does not resolve
 * within `timeoutMs`, the returned promise rejects with a TimeoutError. The
 * underlying fetcher may still complete in the background — callers relying on
 * cancellation semantics should pass an AbortSignal into the fetcher themselves.
 */
export function withTimeout<T>(
  fetcher: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
    fetcher()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const QUERY_TIMEOUT_MS = 10_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 min
      gcTime: 30 * 60 * 1000,             // 30 min
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      networkMode: 'online',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

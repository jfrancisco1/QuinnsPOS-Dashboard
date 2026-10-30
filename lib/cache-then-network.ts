import { readFromCache, type ApiResult } from '@/lib/api';

/**
 * Shows the saved copy of a request first, then the live result, so a screen
 * opens with last-known data instead of a blank wait. `apply` gets the cached
 * data (only if the live result hasn't arrived yet) and then the live data.
 * Resolves to the live result, which already falls back to the cache when the
 * network fails.
 */
export async function cacheThenNetwork<T>(
  call: () => Promise<ApiResult<T>>,
  apply: (data: T) => void,
): Promise<ApiResult<T>> {
  let liveArrived = false;
  readFromCache(call).then((cached) => {
    if (cached && !liveArrived) apply(cached.data);
  });
  const live = await call();
  liveArrived = true;
  if (live.ok) apply(live.data);
  return live;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// Persists the last successful response of each GET request so screens can
// still show data when the device is offline or the API is unreachable.
// Entries are keyed by request path (including query string) and evicted
// least-recently-saved first once the total size passes the budget — Android's
// AsyncStorage defaults to a ~6MB database, so we stay well under that.

const KEY_PREFIX = 'api-cache:';
const INDEX_KEY = 'api-cache-index';
const MAX_ENTRY_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

export type CachedResponse = { data: unknown; savedAt: string };

type IndexEntry = { path: string; size: number; savedAt: number };

let indexPromise: Promise<IndexEntry[]> | null = null;
// Serializes index read-modify-write cycles; screens fire several requests in parallel.
let writeQueue: Promise<void> = Promise.resolve();

function loadIndex(): Promise<IndexEntry[]> {
  if (!indexPromise) {
    indexPromise = AsyncStorage.getItem(INDEX_KEY)
      .then((raw) => (raw ? (JSON.parse(raw) as IndexEntry[]) : []))
      .catch(() => []);
  }
  return indexPromise;
}

export function writeCachedResponse(path: string, data: unknown): void {
  writeQueue = writeQueue
    .then(async () => {
      const savedAt = Date.now();
      const serialized = JSON.stringify({ data, savedAt: new Date(savedAt).toISOString() });
      if (serialized.length > MAX_ENTRY_BYTES) return;

      const index = (await loadIndex()).filter((e) => e.path !== path);
      index.push({ path, size: serialized.length, savedAt });

      const evicted: string[] = [];
      let total = index.reduce((sum, e) => sum + e.size, 0);
      index.sort((a, b) => a.savedAt - b.savedAt);
      while (total > MAX_TOTAL_BYTES && index.length > 1) {
        const oldest = index.shift()!;
        total -= oldest.size;
        evicted.push(KEY_PREFIX + oldest.path);
      }

      indexPromise = Promise.resolve(index);
      await AsyncStorage.setItem(KEY_PREFIX + path, serialized);
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
      if (evicted.length > 0) await AsyncStorage.multiRemove(evicted);
    })
    .catch(() => {
      // Caching is best-effort; a failed write must never break a request.
    });
}

export async function readCachedResponse(path: string): Promise<CachedResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + path);
    return raw ? (JSON.parse(raw) as CachedResponse) : null;
  } catch {
    return null;
  }
}

// Called on logout/login so one account never sees another account's data.
export function clearCachedResponses(): Promise<void> {
  writeQueue = writeQueue
    .then(async () => {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(KEY_PREFIX) || k === INDEX_KEY));
      indexPromise = Promise.resolve([]);
    })
    .catch(() => {});
  return writeQueue;
}

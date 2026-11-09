// The offline cache keeps the last answer of each GET so screens work without internet.
// Writes are queued and best-effort, so tests wait for the queue to drain.

type CacheModule = typeof import('@/lib/offline-cache');

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

let cache: CacheModule;

beforeEach(async () => {
  jest.resetModules();
  const storage = require('@react-native-async-storage/async-storage');
  await (storage.default ?? storage).clear();
  cache = require('@/lib/offline-cache');
});

test('saves and reads back a response with when it was saved', async () => {
  cache.writeCachedResponse('/reports/ready-orders?', { readyOrders: 2 });
  await flush();

  const saved = await cache.readCachedResponse('/reports/ready-orders?');
  expect(saved?.data).toEqual({ readyOrders: 2 });
  expect(Number.isNaN(Date.parse(saved!.savedAt))).toBe(false);
});

test('nothing saved reads as null', async () => {
  await expect(cache.readCachedResponse('/missing')).resolves.toBeNull();
});

test('a newer answer replaces the old one', async () => {
  cache.writeCachedResponse('/store', { name: 'Old' });
  cache.writeCachedResponse('/store', { name: 'New' });
  await flush();

  expect((await cache.readCachedResponse('/store'))?.data).toEqual({ name: 'New' });
});

test('a single response too big to keep is skipped', async () => {
  cache.writeCachedResponse('/orders?big', { blob: 'x'.repeat(600 * 1024) });
  await flush();

  await expect(cache.readCachedResponse('/orders?big')).resolves.toBeNull();
});

test('the oldest answers are evicted once the total passes the budget', async () => {
  const chunk = 'x'.repeat(500 * 1024);
  for (let i = 0; i < 10; i++) cache.writeCachedResponse(`/page-${i}`, { chunk });
  await flush();

  await expect(cache.readCachedResponse('/page-0')).resolves.toBeNull();
  await expect(cache.readCachedResponse('/page-9')).resolves.not.toBeNull();
});

test('logout clears every saved answer so the next account sees none of it', async () => {
  cache.writeCachedResponse('/reports/sales?from=a', { netSales: 100 });
  cache.writeCachedResponse('/expenses', []);
  await cache.clearCachedResponses();

  await expect(cache.readCachedResponse('/reports/sales?from=a')).resolves.toBeNull();
  await expect(cache.readCachedResponse('/expenses')).resolves.toBeNull();
});

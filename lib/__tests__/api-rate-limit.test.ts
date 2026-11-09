// authFetch behaviour that keeps the app under the API's 60 requests/minute limit:
// short-lived reuse of GET answers, sharing identical in-flight GETs, and falling back to
// the offline cache when the API answers 429 with a long wait.

// network-status subscribes to NetInfo, which has no native module under Jest.
jest.mock('@/lib/network-status', () => ({
  reportLiveResponse: jest.fn(),
  reportNetworkFailure: jest.fn(),
}));

type ApiModule = typeof import('@/lib/api');

const READY = { overdueAfterDays: 3, readyOrders: 1, overdueOrders: 0, byFulfillment: {}, orders: [] };

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  };
}

let fetchMock: jest.Mock;
let api: ApiModule;

beforeEach(async () => {
  jest.resetModules();
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const storage = require('@react-native-async-storage/async-storage');
  await (storage.default ?? storage).clear();
  api = require('@/lib/api');
});

afterEach(() => {
  jest.useRealTimers();
});

test('reuses a GET answer for a few seconds instead of asking the API again', async () => {
  fetchMock.mockResolvedValue(jsonResponse(READY));

  const first = await api.getReadyOrders('t', {});
  const second = await api.getReadyOrders('t', {});

  expect(first.ok && second.ok).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('identical GETs in flight share one request', async () => {
  fetchMock.mockResolvedValue(jsonResponse(READY));

  await Promise.all([api.getReadyOrders('t', {}), api.getReadyOrders('t', {})]);

  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('a write clears the reused answers so edits show immediately', async () => {
  fetchMock.mockResolvedValue(jsonResponse(READY));
  await api.getReadyOrders('t', {});

  fetchMock.mockResolvedValueOnce(jsonResponse({ data: { orderNumber: 'QNS-1' } }));
  await api.updateOrderStatus('t', 'QNS-1', 'completed');
  await api.getReadyOrders('t', {});

  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('pull-to-refresh (clearResponseMemo) asks the API again', async () => {
  fetchMock.mockResolvedValue(jsonResponse(READY));
  await api.getReadyOrders('t', {});

  api.clearResponseMemo();
  await api.getReadyOrders('t', {});

  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a long 429 falls back to the saved copy and stops sending until the wait passes', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(READY));
  await api.getReadyOrders('t', {});
  // Let the best-effort cache write finish.
  await new Promise((resolve) => setTimeout(resolve, 0));

  api.clearResponseMemo();
  fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Too Many Attempts.' }, 429, { 'Retry-After': '40' }));
  const limited = await api.getReadyOrders('t', {});
  expect(limited.ok).toBe(true);
  expect(limited.ok && limited.data.readyOrders).toBe(1);

  api.clearResponseMemo();
  const whileBlocked = await api.getReadyOrders('t', {});
  expect(whileBlocked.ok).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a long 429 with nothing saved says how long to wait', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Too Many Attempts.' }, 429, { 'Retry-After': '40' }));

  const result = await api.getReadyOrders('t', {});

  expect(result.ok).toBe(false);
  expect(!result.ok && result.error.status).toBe(429);
  expect(!result.ok && result.error.message).toMatch(/wait \d+s/);
});

test('a write that hits a daily limit keeps the server message', async () => {
  fetchMock.mockResolvedValueOnce(
    jsonResponse({ message: "You've already sent 3 upgrade requests today." }, 429, { 'Retry-After': '3600' }),
  );

  const result = await api.updateOrderStatus('t', 'QNS-1', 'completed');

  expect(!result.ok && result.error.message).toBe("You've already sent 3 upgrade requests today.");
});

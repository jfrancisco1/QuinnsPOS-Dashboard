// lib/api.ts request handling: login, auth failures, error messages, offline fallback and
// the shape of report responses the screens rely on.

jest.mock('@/lib/network-status', () => ({
  reportLiveResponse: jest.fn(),
  reportNetworkFailure: jest.fn(),
}));

type ApiModule = typeof import('@/lib/api');

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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

const EXPENSE = { description: 'Detergent', amount: 350, expense_date: '2026-11-09', note: null };

describe('loginRequest', () => {
  test('returns the token on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: 'abc' }));
    await expect(api.loginRequest({ username: 'quinns.admin', password: 'x' })).resolves.toEqual({
      ok: true,
      data: { token: 'abc' },
    });
  });

  test("shows the API's message on a failed login", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid credentials.' }, 401));
    const result = await api.loginRequest({ username: 'quinns.admin', password: 'wrong' });
    expect(!result.ok && result.error).toEqual({ message: 'Invalid credentials.', status: 401 });
  });

  test('a network failure says the server cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const result = await api.loginRequest({ username: 'quinns.admin', password: 'x' });
    expect(!result.ok && result.error.status).toBe(0);
    expect(!result.ok && result.error.message).toMatch(/reach the server/);
  });
});

describe('authFetch', () => {
  test('sends the bearer token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ breakdown: [], total: 0 }));
    await api.getExpensesByCategory('tok-1', { from: '2026-11-01', to: '2026-11-09' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-1');
  });

  test('a rejected token (401) signs the user out with the message', async () => {
    const onUnauthorized = jest.fn();
    api.setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Your account was turned off.' }, 401));

    const result = await api.getReadyOrders('tok-1', {});

    expect(result.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledWith('tok-1', 'Your account was turned off.');
  });

  test('a validation error shows the first field message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { message: 'The amount field is required. (and 1 more error)', errors: { amount: ['The amount field is required.'] } },
        422,
      ),
    );
    const result = await api.createExpense('t', EXPENSE);
    expect(!result.ok && result.error).toEqual({ message: 'The amount field is required.', status: 422 });
  });

  test('offline, a GET returns the last saved copy', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ breakdown: [], total: 1200 }));
    await api.getExpensesByCategory('t', { from: '2026-11-01', to: '2026-11-09' });
    await flush();

    api.clearResponseMemo();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const offline = await api.getExpensesByCategory('t', { from: '2026-11-01', to: '2026-11-09' });

    expect(offline.ok && offline.data.total).toBe(1200);
  });

  test('offline with nothing saved reports a network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const result = await api.getReadyOrders('t', {});
    expect(!result.ok && result.error.status).toBe(0);
  });

  test('writes are never served from the saved copy', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const result = await api.createExpense('t', EXPENSE);
    expect(result.ok).toBe(false);
  });
});

describe('report shapes', () => {
  test('getExpensesByCategory maps snake_case rows and coerces numbers', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        from: '2026-11-01',
        to: '2026-11-09',
        breakdown: [
          { category_id: 3, category: 'Supplies', transactions: '2', amount: '950.50' },
          { category_id: null, transactions: 1, amount: 100 },
        ],
        total: '1050.50',
      }),
    );

    const result = await api.getExpensesByCategory('t', { from: '2026-11-01', to: '2026-11-09', branch_id: 2 });

    expect(fetchMock.mock.calls[0][0]).toContain('/reports/expenses-by-category?from=2026-11-01&to=2026-11-09&branch_id=2');
    expect(result.ok && result.data).toEqual({
      breakdown: [
        { categoryId: 3, category: 'Supplies', transactions: 2, amount: 950.5 },
        { categoryId: null, category: 'Uncategorized', transactions: 1, amount: 100 },
      ],
      total: 1050.5,
    });
  });

  test('getReadyOrders fills defaults and coerces numbers', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        orders: [
          {
            orderNumber: 'QNS-20261101-1234',
            customer: null,
            fulfillmentType: 'walk_in',
            total: '480.00',
            paymentStatus: 'unpaid',
            readySince: '2026-11-01T02:00:00.000Z',
            daysWaiting: '8',
          },
        ],
      }),
    );

    const result = await api.getReadyOrders('t', {});

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.overdueAfterDays).toBe(3);
    expect(result.data.readyOrders).toBe(0);
    expect(result.data.orders[0].total).toBe(480);
    expect(result.data.orders[0].daysWaiting).toBe(8);
    expect(result.data.orders[0].customer).toBeNull();
  });
});

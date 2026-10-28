import { readCachedResponse, writeCachedResponse } from "@/lib/offline-cache";
import { reportLiveResponse, reportNetworkFailure } from "@/lib/network-status";

// Set EXPO_PUBLIC_API_URL in .env.local to target a local (Sail) API; falls back to production.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://laundryappapi-production.up.railway.app/api/v1";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type LoginPayload = { username: string; password: string };
export type LoginSuccess = { token: string };
export type ApiError = { message: string; status: number };
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Category = {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Item = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  cost: number;
  color: string | null;
  shape: string | null;
  is_active: boolean;
  sort_order: number;
  category: Category;
  created_at: string;
};

export type OrderItem = {
  id: string;
  itemId: string;
  label: string;
  qty: number;
  price: number;
};

export type HistoryUser = {
  id: number;
  name: string;
  role: string;
};

export type PaymentHistoryEntry = {
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  updatedBy: HistoryUser | null;
};

export type OrderStatusHistoryEntry = {
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  updatedBy: HistoryUser | null;
};

export type Customer = {
  id: string;
  nickname: string;
  mobile: string | null;
  address: string | null;
  notes: string | null;
  deliveryFee: string;
  last_visit: string | null;
  total_spend: number;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: number;
  name: string;
  is_active: boolean;
  // Optional (not just nullable): the nested `branch` object inside an Order
  // response may be a trimmed projection that omits these entirely.
  address?: string | null;
  phone?: string | null;
};

export type Order = {
  orderNumber: string;
  customer_id: string;
  customer: Customer;
  fulfillmentType: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  branch: Branch;
  items: OrderItem[];
  paymentHistory?: PaymentHistoryEntry[];
  orderStatusHistory?: OrderStatusHistoryEntry[];
};

export type SalesSummary = {
  from: string;
  to: string;
  branch: number | null;
  grossSales: number;
  discounts: number;
  netSales: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  collected: number;
  outstanding: number;
  unpaidOrders: number;
  unpaid: { orders: number; grossSales: number };
  group_by: "hour" | "day" | "month" | "year";
  series: { label: string; net_sales: number }[];
};

export type SalesByItem = {
  item_id: string;
  label: string;
  category: string;
  qty: number;
  net_sales: number;
  cost_of_goods: number;
  gross_profit: number;
  color: string | null;
  shape: string | null;
};

export type ExpenseCategory = {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  note: string | null;
  expense_category_id: number | null;
  category: ExpenseCategory | null;
  user_id: number;
  branch_id: number | null;
  tenant_id: number | null;
  created_at: string;
  updated_at: string;
};

// ─── Payload types ────────────────────────────────────────────────────────────

export type CreateItemPayload = {
  name: string;
  price: number;
  cost: number;
  description?: string;
  color?: string;
  shape?: string;
  is_active: boolean;
  category_id: number;
  sort_order?: number;
  // Which branch's price list it joins (items are per branch).
  branch_id?: number;
};

export type CreateCategoryPayload = {
  name: string;
  is_active: boolean;
  sort_order?: number;
};

export type CreateExpensePayload = {
  description: string;
  amount: number;
  expense_date: string;
  note: string | null;
  branch_id?: number;
  expense_category_id?: number;
};

export type CreateExpenseCategoryPayload = {
  name: string;
  is_active?: boolean;
  sort_order?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractObject<T>(json: unknown): T | null {
  if (typeof json === "object" && json !== null) {
    const j = json as Record<string, unknown>;
    if ("data" in j && typeof j["data"] === "object" && j["data"] !== null) {
      return j["data"] as T;
    }
  }
  return null;
}

function extractArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (typeof json === "object" && json !== null) {
    const j = json as Record<string, unknown>;
    for (const key of [
      "data",
      "orders",
      "items",
      "categories",
      "expenses",
      "expense_categories",
      "branches",
    ]) {
      if (Array.isArray(j[key])) return j[key] as T[];
    }
  }
  return [];
}

function extractToken(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return null;
  const j = json as Record<string, unknown>;
  const raw = j["token"] ?? j["access_token"] ?? j["access"];
  return typeof raw === "string" ? raw : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The backend throttles requests ("Too Many Attempts"), which pagination-heavy
// screens (e.g. reconciliation paging through a month of orders) can trip in a
// normal burst. Back off and retry a few times before surfacing the error.
const MAX_RATE_LIMIT_RETRIES = 3;

// Without a timeout, a request on a dead connection can hang indefinitely
// instead of failing over to the offline cache.
const REQUEST_TIMEOUT_MS = 30_000;

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your internet connection.";

// GET responses are cached so screens can render the last-known data offline.
// Search results are skipped: they're one-off queries that would only crowd
// out the cache.
function isCacheable(path: string, options: RequestInit): boolean {
  const method = (options.method ?? "GET").toUpperCase();
  return method === "GET" && !/[?&]search=/.test(path);
}

async function authFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const cacheable = isCacheable(path, options);
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        signal: controller.signal,
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers ?? {}),
        },
      });

      if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
        await delay(waitMs);
        continue;
      }

      reportLiveResponse();
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        if (response.ok) {
          return { ok: true, data: null as T };
        }
        return { ok: false, error: { message: `HTTP ${response.status}`, status: response.status } };
      }
      if (response.ok) {
        if (cacheable) writeCachedResponse(path, json);
        return { ok: true, data: json as T };
      }
      const err = json as Record<string, unknown>;
      let message =
        typeof err["message"] === "string" ? err["message"] : "Request failed";
      if (err["errors"] && typeof err["errors"] === "object") {
        const firstField = Object.values(err["errors"] as Record<string, string[]>)[0];
        if (Array.isArray(firstField) && firstField.length > 0) {
          message = firstField[0];
        }
      }
      return { ok: false, error: { message, status: response.status } };
    } catch {
      const cached = cacheable ? await readCachedResponse(path) : null;
      reportNetworkFailure(cached?.savedAt ?? null);
      if (cached) {
        return { ok: true, data: cached.data as T };
      }
      return { ok: false, error: { message: NETWORK_ERROR_MESSAGE, status: 0 } };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginRequest(
  payload: LoginPayload,
): Promise<ApiResult<LoginSuccess>> {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: unknown = await response.json();
    if (response.ok) {
      const token = extractToken(json);
      if (!token) {
        return {
          ok: false,
          error: {
            message: "Unexpected response from server",
            status: response.status,
          },
        };
      }
      return { ok: true, data: { token } };
    }
    const errorJson = json as Record<string, unknown>;
    const message =
      typeof errorJson["message"] === "string"
        ? errorJson["message"]
        : typeof errorJson["error"] === "string"
          ? errorJson["error"]
          : "Invalid credentials";
    return { ok: false, error: { message, status: response.status } };
  } catch {
    return { ok: false, error: { message: NETWORK_ERROR_MESSAGE, status: 0 } };
  }
}

export function logoutRequest(token: string) {
  return authFetch<null>(token, "/logout", { method: "POST" });
}

// features and limits come from effective_plan (which already accounts for the
// trial and extra branches), so gate on these, never on plan. null = unlimited.
export type TenantLimits = {
  max_branches: number | null;
  max_admins: number | null;
  max_staff: number | null;
  max_drivers: number | null;
};

export type Tenant = {
  id: number;
  name: string;
  plan: string;
  effective_plan: string;
  on_trial: boolean;
  trial_ends_at: string | null;
  billing_cycle: "monthly" | "yearly" | null;
  paid_until: string | null;
  features: string[];
  limits: TenantLimits;
};

export type CurrentUser = {
  id: number;
  name: string;
  username: string;
  role: string;
  tenant_id: number;
  branch_id: number | null;
  must_change_password: boolean;
  token_expires_at: string | null;
  // null for superadmin accounts, which don't belong to a tenant.
  tenant: Tenant | null;
};

export async function getMe(token: string): Promise<ApiResult<CurrentUser>> {
  const result = await authFetch<unknown>(token, "/me");
  if (!result.ok) return result;
  const user = extractObject<CurrentUser>(result.data) ?? (result.data as CurrentUser);
  return { ok: true, data: user };
}

export function changePassword(
  token: string,
  data: { current_password: string; new_password: string },
) {
  return authFetch<{ message: string }>(token, "/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrdersPage = {
  data: Order[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function getOrders(
  token: string,
  params?: {
    from?: string;
    to?: string;
    branch_id?: number;
    cursor?: string;
    search?: string;
    payment_status?: string;
    date_basis?: 'created' | 'paid';
  },
): Promise<ApiResult<OrdersPage>> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.branch_id != null) query.set('branch_id', String(params.branch_id));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.search) query.set('search', params.search);
  if (params?.payment_status) query.set('payment_status', params.payment_status);
  if (params?.date_basis) query.set('date_basis', params.date_basis);
  const qs = query.toString();
  const result = await authFetch<unknown>(token, `/orders${qs ? `?${qs}` : ''}`);
  if (!result.ok) return result;
  const raw = result.data as { data?: unknown; nextCursor?: string | null; hasMore?: boolean };
  return {
    ok: true,
    data: {
      data: extractArray<Order>(raw.data ?? raw),
      nextCursor: raw.nextCursor ?? null,
      hasMore: raw.hasMore ?? false,
    },
  };
}

export type LoadsBreakdownRow = { itemId: string; label: string; qty: number };
export type LoadsSummary = {
  totalLoads: number;
  orderCount: number;
  breakdown: LoadsBreakdownRow[];
  // Order counts keyed by normalized fulfillmentType ('walk_in', 'pickup_deliver', ...).
  ordersByFulfillment: Record<string, number>;
};

// Loads = sum of order item quantities across ALL orders in the range, regardless
// of payment status (unlike the sales reports, which only cover paid orders).
// Aggregated server-side so long ranges cost one request instead of paging /orders.
export async function getLoadsSummary(
  token: string,
  params: { from: string; to: string; branch_id?: number },
): Promise<ApiResult<LoadsSummary>> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  if (params.branch_id != null) query.set('branch_id', String(params.branch_id));
  const result = await authFetch<unknown>(token, `/reports/loads?${query.toString()}`);
  if (!result.ok) return result;
  const raw = result.data as Partial<LoadsSummary>;
  return {
    ok: true,
    data: {
      totalLoads: Number(raw.totalLoads ?? 0),
      orderCount: Number(raw.orderCount ?? 0),
      breakdown: (raw.breakdown ?? []).map((row) => ({
        itemId: String(row.itemId),
        label: row.label,
        qty: Number(row.qty),
      })),
      ordersByFulfillment: raw.ordersByFulfillment ?? {},
    },
  };
}

export type PaymentStatus = 'unpaid' | 'paid_cash' | 'paid_gcash' | 'paid_bank' | 'paid_others';
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export async function updateOrderPaymentStatus(
  token: string,
  orderNumber: string,
  paymentStatus: PaymentStatus,
): Promise<ApiResult<Order>> {
  const result = await authFetch<unknown>(token, `/orders/${orderNumber}/payment-status?paymentStatus=${paymentStatus}`, {
    method: 'PATCH',
  });
  if (!result.ok) return result;
  const order = extractObject<Order>(result.data) ?? (result.data as Order);
  return { ok: true, data: order };
}

export async function updateOrderStatus(
  token: string,
  orderNumber: string,
  orderStatus: OrderStatus,
): Promise<ApiResult<Order>> {
  const result = await authFetch<unknown>(token, `/orders/${orderNumber}/order-status?orderStatus=${orderStatus}`, {
    method: 'PATCH',
  });
  if (!result.ok) return result;
  const order = extractObject<Order>(result.data) ?? (result.data as Order);
  return { ok: true, data: order };
}

export async function getOrderByNumber(
  token: string,
  id: string,
): Promise<ApiResult<Order>> {
  const result = await authFetch<unknown>(token, `/orders/${id}`);
  if (!result.ok) return result;
  const order = extractObject<Order>(result.data);
  if (!order) {
    return {
      ok: false,
      error: { message: "Unexpected response shape", status: 0 },
    };
  }
  return { ok: true, data: order };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getSalesSummary(
  token: string,
  period: "today" | "this_week" | "this_month" | "this_year" | "custom",
  opts?: { from?: string; to?: string; branch_id?: number },
): Promise<ApiResult<SalesSummary>> {
  const params = new URLSearchParams();
  if (period === "custom") {
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
  } else {
    params.set("period", period);
  }
  if (opts?.branch_id) params.set("branch_id", String(opts.branch_id));
  const result = await authFetch<unknown>(
    token,
    `/reports/sales?${params.toString()}`,
  );
  if (!result.ok) return result;
  const summary = extractObject<SalesSummary>(result.data);
  const data = summary ?? (result.data as SalesSummary);
  return { ok: true, data };
}

export type SalesByPaymentType = {
  payment_method: string;
  transactions: number;
  payment_amount: number;
};

export async function getSalesByPaymentType(
  token: string,
  period: "today" | "this_week" | "this_month" | "this_year" | "custom",
  opts?: { from?: string; to?: string; branch_id?: number; date_basis?: "created" | "paid" },
): Promise<ApiResult<SalesByPaymentType[]>> {
  const params = new URLSearchParams();
  if (period === "custom") {
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
  } else {
    params.set("period", period);
  }
  if (opts?.branch_id) params.set("branch_id", String(opts.branch_id));
  if (opts?.date_basis) params.set("date_basis", opts.date_basis);
  const result = await authFetch<unknown>(
    token,
    `/reports/sales-by-payment-type?${params.toString()}`,
  );
  if (!result.ok) return result;
  // response wraps data under "breakdown" and includes an "unpaid" summary
  const raw = result.data as Record<string, unknown>;
  const breakdown = Array.isArray(raw["breakdown"])
    ? (raw["breakdown"] as SalesByPaymentType[])
    : [];
  const unpaid = raw["unpaid"] as { transactions: number; amount: number } | undefined;
  const alreadyHasUnpaid = breakdown.some((r) => r.payment_method.toLowerCase() === "unpaid");
  if (unpaid && !alreadyHasUnpaid) {
    breakdown.push({ payment_method: "unpaid", transactions: unpaid.transactions, payment_amount: unpaid.amount });
  }
  return { ok: true, data: breakdown };
}

export async function getSalesByItem(
  token: string,
  period: "today" | "this_week" | "this_month" | "this_year" | "custom",
  opts?: { from?: string; to?: string; branch_id?: number },
): Promise<ApiResult<SalesByItem[]>> {
  const params = new URLSearchParams();
  if (period === "custom") {
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
  } else {
    params.set("period", period);
  }
  if (opts?.branch_id) params.set("branch_id", String(opts.branch_id));
  const result = await authFetch<unknown>(
    token,
    `/reports/sales-by-item?${params.toString()}`,
  );
  if (!result.ok) return result;
  return { ok: true, data: extractArray<SalesByItem>(result.data) };
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function getItems(token: string, opts?: { branch_id?: number }): Promise<ApiResult<Item[]>> {
  const params = new URLSearchParams();
  if (opts?.branch_id) params.set('branch_id', String(opts.branch_id));
  const qs = params.toString();
  const result = await authFetch<unknown>(token, `/items${qs ? `?${qs}` : ''}`);
  if (!result.ok) return result;
  return { ok: true, data: extractArray<Item>(result.data) };
}

export function createItem(token: string, data: CreateItemPayload) {
  return authFetch<Item>(token, "/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getItemById(token: string, id: number) {
  return authFetch<Item>(token, `/items/${id}`);
}

export function updateItem(
  token: string,
  id: number,
  data: Partial<CreateItemPayload>,
) {
  return authFetch<Item>(token, `/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteItem(token: string, id: number) {
  return authFetch<null>(token, `/items/${id}`, { method: "DELETE" });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(
  token: string,
): Promise<ApiResult<Category[]>> {
  const result = await authFetch<unknown>(token, "/categories");
  if (!result.ok) return result;
  return { ok: true, data: extractArray<Category>(result.data) };
}

export function createCategory(token: string, data: CreateCategoryPayload) {
  return authFetch<Category>(token, "/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCategoryById(token: string, id: number) {
  return authFetch<Category>(token, `/categories/${id}`);
}

export function updateCategory(
  token: string,
  id: number,
  data: Partial<CreateCategoryPayload>,
) {
  return authFetch<Category>(token, `/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(token: string, id: number) {
  return authFetch<null>(token, `/categories/${id}`, { method: "DELETE" });
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export async function getBranches(token: string): Promise<ApiResult<Branch[]>> {
  const result = await authFetch<unknown>(token, "/branches");
  if (!result.ok) return result;
  return { ok: true, data: extractArray<Branch>(result.data) };
}

export type BranchPayload = {
  name: string;
  address?: string;
  phone?: string;
};

export async function createBranch(token: string, data: BranchPayload): Promise<ApiResult<Branch>> {
  const result = await authFetch<unknown>(token, "/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<Branch>(result.data) ?? (result.data as Branch) };
}

export async function updateBranch(
  token: string,
  id: number,
  data: Partial<BranchPayload>,
): Promise<ApiResult<Branch>> {
  const result = await authFetch<unknown>(token, `/branches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<Branch>(result.data) ?? (result.data as Branch) };
}

// Hard delete: the database cascades to the branch's orders, items, expenses,
// pickups and the customers first registered there. Callers must guard it.
export function deleteBranch(token: string, id: number) {
  return authFetch<{ message: string }>(token, `/branches/${id}`, { method: "DELETE" });
}

// ─── Store ──────────────────────────────────────────────────────────────────
// GET is available to any authenticated user; PATCH is admin-only.

export type Store = {
  id: number;
  name: string | null;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gcash_number: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateStorePayload = Partial<{
  name: string;
  email: string;
  phone: string;
  address: string;
  gcash_number: string;
}>;

export async function getStore(token: string): Promise<ApiResult<Store>> {
  const result = await authFetch<unknown>(token, "/store");
  if (!result.ok) return result;
  const store = extractObject<Store>(result.data);
  if (!store) {
    return { ok: false, error: { message: "Unexpected response shape", status: 0 } };
  }
  return { ok: true, data: store };
}

export function updateStore(token: string, data: UpdateStorePayload) {
  return authFetch<Store>(token, "/store", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(
  token: string,
  opts?: { branch_id?: number },
): Promise<ApiResult<Expense[]>> {
  const params = new URLSearchParams();
  if (opts?.branch_id) params.set("branch_id", String(opts.branch_id));
  const query = params.toString();
  const result = await authFetch<unknown>(token, `/expenses${query ? `?${query}` : ""}`);
  if (!result.ok) return result;
  return { ok: true, data: extractArray<Expense>(result.data) };
}

export function createExpense(token: string, data: CreateExpensePayload) {
  return authFetch<Expense>(token, "/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExpense(token: string, id: string, data: CreateExpensePayload) {
  return authFetch<Expense>(token, `/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(token: string, id: string) {
  return authFetch<unknown>(token, `/expenses/${id}`, { method: "DELETE" });
}

// ─── Expense Categories ───────────────────────────────────────────────────────

export async function getExpenseCategories(
  token: string,
): Promise<ApiResult<ExpenseCategory[]>> {
  const result = await authFetch<unknown>(token, "/expense-categories");
  if (!result.ok) return result;
  return { ok: true, data: extractArray<ExpenseCategory>(result.data) };
}

export function createExpenseCategory(token: string, data: CreateExpenseCategoryPayload) {
  return authFetch<ExpenseCategory>(token, "/expense-categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExpenseCategory(
  token: string,
  id: number,
  data: Partial<CreateExpenseCategoryPayload>,
) {
  return authFetch<ExpenseCategory>(token, `/expense-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteExpenseCategory(token: string, id: number) {
  return authFetch<null>(token, `/expense-categories/${id}`, { method: "DELETE" });
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

export type UpgradeRequestPayload = {
  plan: "starter" | "pro";
  billing_cycle: "monthly" | "yearly";
  note?: string;
};

// Emails our team and the shop's payment instructions; the plan itself only
// changes once the payment is recorded. Limited to 3 per day (429 after).
export function requestUpgrade(token: string, data: UpgradeRequestPayload) {
  return authFetch<{ message: string }>(token, "/upgrade-request", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Team ─────────────────────────────────────────────────────────────────────
// Admin only. Admin accounts are listed but read-only (403 if changed).

export type TeamRole = "admin" | "staff" | "delivery";

export type TeamMember = {
  id: number;
  name: string;
  username: string;
  role: TeamRole;
  is_active: boolean;
  tenant_id: number;
  branch_id: number | null;
  branch: { id: number; name: string } | null;
  created_at: string;
};

export type CreateTeamMemberPayload = {
  name: string;
  username: string;
  password: string;
  role: "staff" | "delivery";
  branch_id: number;
};

export type UpdateTeamMemberPayload = Partial<Omit<CreateTeamMemberPayload, "username">>;

export async function getTeamMembers(token: string): Promise<ApiResult<TeamMember[]>> {
  const result = await authFetch<unknown>(token, "/users");
  if (!result.ok) return result;
  return { ok: true, data: extractArray<TeamMember>(result.data) };
}

export async function createTeamMember(
  token: string,
  data: CreateTeamMemberPayload,
): Promise<ApiResult<TeamMember>> {
  const result = await authFetch<unknown>(token, "/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<TeamMember>(result.data) ?? (result.data as TeamMember) };
}

// Setting a password revokes all of the account's tokens (signed out everywhere).
export async function updateTeamMember(
  token: string,
  id: number,
  data: UpdateTeamMemberPayload,
): Promise<ApiResult<TeamMember>> {
  const result = await authFetch<unknown>(token, `/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<TeamMember>(result.data) ?? (result.data as TeamMember) };
}

// Deactivating signs the account out everywhere.
export async function toggleTeamMember(token: string, id: number): Promise<ApiResult<TeamMember>> {
  const result = await authFetch<unknown>(token, `/users/${id}/toggle`, { method: "PATCH" });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<TeamMember>(result.data) ?? (result.data as TeamMember) };
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
// Admin only. The setup checklist's hand ticks are stored on the shop, so they
// survive reinstalls and are the same on every device.

export type OnboardingStep = "branch" | "prices" | "staff" | "driver" | "order";

export type OnboardingStatus = {
  ticked: Record<OnboardingStep | "dismissed", boolean>;
  has_staff: boolean;
  has_driver: boolean;
  has_order: boolean;
};

export async function getOnboarding(token: string): Promise<ApiResult<OnboardingStatus>> {
  const result = await authFetch<unknown>(token, "/onboarding");
  if (!result.ok) return result;
  return { ok: true, data: extractObject<OnboardingStatus>(result.data) ?? (result.data as OnboardingStatus) };
}

export async function updateOnboarding(
  token: string,
  step: OnboardingStep | "dismissed",
  done: boolean,
): Promise<ApiResult<OnboardingStatus>> {
  const result = await authFetch<unknown>(token, "/onboarding", {
    method: "PATCH",
    body: JSON.stringify({ step, done }),
  });
  if (!result.ok) return result;
  return { ok: true, data: extractObject<OnboardingStatus>(result.data) ?? (result.data as OnboardingStatus) };
}

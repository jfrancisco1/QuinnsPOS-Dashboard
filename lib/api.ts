const BASE_URL = "https://laundryappapi-production.up.railway.app/api/v1";

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
};

export type Order = {
  id: string;
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

export type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  note: string | null;
  user_id: number;
  created_at: string;
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

async function authFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return { ok: false, error: { message: `HTTP ${response.status}`, status: response.status } };
    }
    if (response.ok) {
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
    return { ok: false, error: { message: "Network error", status: 0 } };
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
    return { ok: false, error: { message: "Network error", status: 0 } };
  }
}

export function logoutRequest(token: string) {
  return authFetch<null>(token, "/logout", { method: "POST" });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrdersPage = {
  data: Order[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function getOrders(
  token: string,
  params?: { from?: string; to?: string; branch_id?: number; cursor?: string; search?: string; payment_status?: string },
): Promise<ApiResult<OrdersPage>> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.branch_id != null) query.set('branch_id', String(params.branch_id));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.search) query.set('search', params.search);
  if (params?.payment_status) query.set('payment_status', params.payment_status);
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
  opts?: { from?: string; to?: string; branch_id?: number },
): Promise<ApiResult<SalesByPaymentType[]>> {
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
    `/reports/sales-by-payment-type?${params.toString()}`,
  );
  if (!result.ok) return result;
  // response wraps data under "breakdown"
  const raw = result.data as Record<string, unknown>;
  const breakdown = Array.isArray(raw["breakdown"])
    ? (raw["breakdown"] as SalesByPaymentType[])
    : [];
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

export async function getItems(token: string): Promise<ApiResult<Item[]>> {
  const result = await authFetch<unknown>(token, "/items");
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

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(
  token: string,
): Promise<ApiResult<Expense[]>> {
  const result = await authFetch<unknown>(token, "/expenses");
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

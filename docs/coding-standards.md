# Coding Standards — QuinnsPOS Dashboard

## Language & Tooling

- **TypeScript strict mode** is enforced. No `any` types; use `unknown` and narrow explicitly.
- All files must be `.ts` or `.tsx`. No plain `.js` files in `app/`, `components/`, or `hooks/`.
- Use the `@/` path alias for all internal imports — never use relative `../` paths that cross directory boundaries.

```ts
// Good
import { ThemedText } from '@/components/themed-text';

// Bad
import { ThemedText } from '../../components/themed-text';
```

---

## File & Folder Naming

| Type | Convention | Example |
|---|---|---|
| Components | `kebab-case.tsx` | `order-card.tsx` |
| Hooks | `use-kebab-case.ts` | `use-cart-total.ts` |
| Constants | `kebab-case.ts` | `theme.ts` |
| Screen files (routes) | `kebab-case.tsx` | `order-history.tsx` |
| Platform-specific | `name.ios.tsx` / `name.tsx` | `icon-symbol.ios.tsx` |

---

## Project Structure

The codebase follows a **modular, component-based architecture**. Each feature or UI concern is broken into small, focused, reusable units:

- **Screens** (`app/`) orchestrate layout and data flow — they should be thin and delegate rendering to components.
- **Components** (`components/`) are self-contained, reusable UI pieces. Group related components in a subdirectory (e.g., `components/orders/`, `components/reports/`).
- **Hooks** (`hooks/`) encapsulate all non-trivial state, effects, and business logic — keeping it out of components and screens.
- **Lib** (`lib/`) holds shared utilities and the API client — nothing UI-specific goes here.

Avoid placing business logic directly in screens. If a screen grows complex, split it into child components and extract logic into hooks.

---

## Components

- **Named exports** for all components (no default exports except route screens in `app/`).
- Route screens in `app/` use `export default` as required by Expo Router.
- Define prop types with a `Props` suffix above the component.

```tsx
// components/order-card.tsx
export type OrderCardProps = {
  orderId: string;
  total: number;
  onPress: () => void;
};

export function OrderCard({ orderId, total, onPress }: OrderCardProps) {
  // ...
}
```

- Keep components focused. Extract logic into custom hooks when a component has non-trivial state or effects.
- Place `StyleSheet.create(...)` at the bottom of the file, after the component.

---

## Theming

- Never hardcode colors directly. Use NativeWind's dark mode utilities (`dark:`) and Tailwind color tokens.
- Map semantic color tokens to Tailwind classes (e.g., `bg-background`, `text-foreground`) via `tailwind.config.js` theme extensions.
- For dynamic colors that must be resolved at runtime (e.g., passed to non-NativeWind components), use `useThemeColor()` as a fallback.

```tsx
// Good — NativeWind dark mode
<View className="bg-white dark:bg-zinc-900" />

// Good — semantic token defined in tailwind.config.js
<Text className="text-foreground" />

// Bad
<View style={{ backgroundColor: '#fff' }} />
```

---

## Styling

- **Use NativeWind (`className`) as the primary styling mechanism.** Avoid `StyleSheet.create()` for new components.
- Reserve `StyleSheet.create()` only for values that cannot be expressed as Tailwind utilities (e.g., truly dynamic computed values).
- Do not mix `className` and `style` on the same element unless the `style` prop carries a value unavailable in Tailwind.
- Use `gap-*` utilities instead of margin for spacing between flex siblings.
- Prefer flex-based layouts (`flex-1`, `flex-row`, `items-center`, etc.) over absolute pixel values.
- Keep `className` strings readable — break long class lists across lines using a template literal or the `cn()` utility if one exists.

---

## Platform-Specific Code

- Use `.ios.tsx` / `.android.tsx` / `.web.ts` file extensions for platform-specific implementations. The base file (no extension) serves as the Android/web fallback.
- Prefer extension-based splitting over `Platform.select()` or `Platform.OS` checks inside shared files when the difference is substantial.
- Use `Platform.select()` only for small inline differences (e.g., a single style value or string).

---

## Hooks

- All custom hooks live in `hooks/` and are prefixed with `use`.
- Hooks must not have side effects on mount unless clearly documented.
- Do not call hooks conditionally.

---

## Expo Router & Navigation

- All screens live under `app/`. Do not place screen-level components elsewhere.
- Grouped routes use parentheses: `app/(tabs)/`. Groups do not affect the URL.
- Use the `<Link>` component from `expo-router` for navigation — avoid imperative `router.push()` in JSX.
- Pass route params via typed `useLocalSearchParams<{ id: string }>()`.

---

## State Management

- Prefer local component state (`useState`) for UI-only state.
- Use React Context for state shared across a feature subtree.
- Keep context providers close to where they are consumed — do not always hoist to the root layout.

---

## API Integration

**Base URL:** `https://laundryappapi-production.up.railway.app/api/v1`

All requests (except `POST /login`) require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

The token is obtained from `POST /login` and stored/retrieved from context or secure storage.

### Endpoints Reference

#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Login with `username` + `password`; returns token |
| POST | `/logout` | Required | Invalidate current token |
| GET | `/me` | Required | Get current user + token expiry |

#### Branches
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/branches` | Required | List all active branches |
| POST | `/branches` | Admin only | Create branch (`name`, `address`, `phone`, `is_active`) |
| GET | `/branches/{id}` | Required | Get single branch |
| PATCH | `/branches/{id}` | Admin only | Update branch fields |
| DELETE | `/branches/{id}` | Admin only | Delete branch |

#### Customers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/customers` | List all customers |
| POST | `/customers` | Create (`nickname` required, `mobile`, `address`, `notes`, `delivery_fee`) |
| GET | `/customers/{id}` | Get single customer |
| PUT | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Soft delete customer |

#### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | List all orders with nested items |
| POST | `/orders` | Create order (see schema below) |
| GET | `/orders/{orderNumber}` | Get single order with customer details |
| PUT | `/orders/{orderNumber}` | Update order |
| DELETE | `/orders/{orderNumber}` | Delete order |

**POST /orders body:**
```ts
{
  customer_id: number;           // required
  fulfillmentType: 'walk-in' | 'pickup-deliver'; // required
  subtotal: number;              // required
  deliveryFee: number;           // required
  discountAmount?: number;       // defaults 0
  total: number;                 // required
  createdAt?: string;            // ISO 8601
  paymentStatus?: 'unpaid' | 'pending' | 'paid_gcash' | 'paid_cash';
  orderStatus?: 'in_progress' | 'ready' | 'completed';
  items: Array<{                 // min 1 item
    itemId: string;
    label: string;
    qty: number;
    price: number;
  }>;
}
```

#### Expenses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/expenses` | List all expenses |
| POST | `/expenses` | Create (`description`, `amount`, `expense_date` YYYY-MM-DD, `note`) |
| GET | `/expenses/{id}` | Get single expense |
| PUT | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |

#### Reports
All report endpoints accept: `period` (today | this_week | this_month | this_year | custom), `from`/`to` (YYYY-MM-DD, required when period=custom), `branch_id` (admin only).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/sales` | Gross sales, discounts, net sales, COGS, gross profit |
| GET | `/reports/sales-by-item` | Item-level breakdown with top items |
| GET | `/reports/sales-by-payment-type` | Payment method breakdown |

#### Categories & Items
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/categories` | List or create categories (`name`, `is_active`) |
| GET/PUT/DELETE | `/categories/{id}` | Get, update, or delete category |
| GET/POST | `/items` | List or create items (`name`, `price`, `cost`, `description`, `color` hex, `shape`, `is_active`, `category_id`) |
| GET/PUT/DELETE | `/items/{id}` | Get, update, or delete item |

### API Calling Conventions

- All API calls go through `lib/api.ts` — do not call `fetch` directly in components.
- Handle 401 responses globally (token expiry → redirect to login).
- Use TypeScript types for all request bodies and responses — no `any`.
- Errors from the API return `{ detail: string }` or `{ detail: [...] }` for 422 validation errors.

---

## Imports Order

Maintain this order, separated by blank lines:

1. React / React Native core
2. Expo packages
3. Third-party libraries
4. Internal aliases (`@/components`, `@/hooks`, `@/constants`)

```ts
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Link } from 'expo-router';

import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
```

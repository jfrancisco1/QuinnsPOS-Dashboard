# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR to open on device)
npm run android    # Launch on Android emulator
npm run ios        # Launch on iOS simulator
npm run web        # Launch web version in browser
npm run lint       # Run ESLint
```

No test suite is configured yet.

## Architecture

**Expo Router (file-based routing)** drives navigation. The `app/` directory maps directly to routes:
- `app/_layout.tsx` — root layout (ThemeProvider, StatusBar)
- `app/(tabs)/` — tab group; `_layout.tsx` defines the tab bar, each file is a tab screen
- `app/modal.tsx` — modal route

**Theme system**: NativeWind is the primary styling layer. Light/dark mode is handled via NativeWind's `dark:` utilities and semantic tokens defined in `tailwind.config.js`. `useThemeColor()` is a fallback for runtime color values needed by non-NativeWind components.

**Platform-specific files**: Expo's platform extension convention is used throughout. Files ending in `.ios.tsx` (e.g., `components/ui/icon-symbol.ios.tsx`) are loaded only on iOS; the base file handles Android/web. The icon system maps SF Symbols (iOS) to Material Icons (Android/web) in `components/ui/icon-symbol.tsx`.

**Path alias**: `@/` resolves to the project root (configured in `tsconfig.json`).

**Key config**: `app.json` enables New Architecture, React Compiler (experimental), and typed routes. Web output is set to `static`.

## API

**Base URL:** `https://laundryappapi-production.up.railway.app/api/v1`

All requests require `Authorization: Bearer <token>` except `POST /login`. Key endpoints:
- **Auth**: `POST /login`, `POST /logout`, `GET /me`
- **Branches**: `GET|POST /branches`, `GET|PATCH|DELETE /branches/{id}`
- **Customers**: `GET|POST /customers`, `GET|PUT|DELETE /customers/{id}`
- **Orders**: `GET|POST /orders`, `GET|PUT|DELETE /orders/{orderNumber}` (keyed by orderNumber string, not id)
- **Expenses**: `GET|POST /expenses`, `GET|PUT|DELETE /expenses/{id}`
- **Reports**: `GET /reports/sales`, `/reports/sales-by-item`, `/reports/sales-by-payment-type` — all accept `period`, `from`, `to`, `branch_id` query params
- **Categories/Items**: full CRUD at `/categories` and `/items`

Full endpoint schemas are in [`docs/coding-standards.md`](docs/coding-standards.md#api-integration). All API calls go through `lib/api.ts`.

## Coding Standards

Full standards are in [`docs/coding-standards.md`](docs/coding-standards.md). Key rules:

- **No hardcoded colors** — use NativeWind `className` with `dark:` utilities; add semantic tokens to `tailwind.config.js`
- **Styling**: NativeWind `className` is the primary mechanism — avoid `StyleSheet.create()` for new components
- **Named exports** for all components except route screens (`app/`), which use `export default`
- **File naming**: `kebab-case.tsx` for components, `use-kebab-case.ts` for hooks
- **`@/` alias** for all internal imports — no cross-directory relative paths
- **Platform splits**: use `.ios.tsx` / `.android.tsx` file extensions for substantial differences; `Platform.select()` only for small inline values
- **Imports order**: React/RN core → Expo → third-party → internal `@/` aliases

# Quinn's POS Dashboard

An admin dashboard for managing the **Quinn's POS** point-of-sale system. Built with Expo (React Native), it serves as a CMS-style interface for administrators to view and manage data across the Quinn's POS app — including products, orders, expenses, sales reports, and more.

---

## Tech Stack

- [Expo](https://expo.dev) / React Native (with New Architecture)
- [Expo Router](https://expo.dev/router) — file-based navigation
- [NativeWind](https://www.nativewind.dev/) — Tailwind CSS for React Native
- TypeScript

## Prerequisites

- Node.js >= 18
- npm
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode + iOS Simulator
- For Android: Android Studio + Emulator

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd QuinnsPOS-Dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   Scan the QR code with Expo Go, or open in a simulator.

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Launch on Android emulator |
| `npm run ios` | Launch on iOS simulator |
| `npm run web` | Launch web version in browser |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/              # File-based routes (Expo Router)
  (tabs)/         # Tab navigation screens
  _layout.tsx     # Root layout
features/         # Feature modules (components, hooks, types)
components/
  ui/             # Shared UI primitives
hooks/            # Cross-feature hooks
lib/              # API client and utilities
docs/             # Coding standards and documentation
```

## API

The app connects to the Quinn's POS backend:

- **Base URL:** `https://laundryappapi-production.up.railway.app/api/v1`
- **Interactive docs:** `https://laundryappapi-production.up.railway.app/docs`

All requests require `Authorization: Bearer <token>` except `POST /login`.

## Environment

No `.env` file is required — the API base URL is configured in `lib/api.ts`.

## Contributing

1. Create a feature branch from `master`
2. Follow the coding standards in [`docs/coding-standards.md`](docs/coding-standards.md)
3. Submit a pull request

## License

Private — all rights reserved.

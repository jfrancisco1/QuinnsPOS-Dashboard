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

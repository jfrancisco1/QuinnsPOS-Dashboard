import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

/**
 * Backed by NativeWind's colorScheme so that a user override set via
 * ThemePreferenceProvider (light/dark/system) is reflected everywhere this
 * hook is used, not just in NativeWind `dark:` classes.
 */
export function useColorScheme() {
  const { colorScheme } = useNativeWindColorScheme();
  return colorScheme;
}

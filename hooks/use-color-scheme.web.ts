import { useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Backed by NativeWind's colorScheme so a user override set via ThemePreferenceProvider applies here too.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useNativeWindColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}

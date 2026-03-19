/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Violet family — professional brand palette
const tintColorLight = '#7C3AED'; // violet-600
const tintColorDark = '#A78BFA';  // violet-400

export const Colors = {
  light: {
    text: '#1E1B4B',           // indigo-950 — deep readable dark
    background: '#FFFFFF',     // clean white
    tint: tintColorLight,      // violet-600
    icon: '#7C3AED',           // violet-600
    tabIconDefault: '#9CA3AF', // gray-400
    tabIconSelected: tintColorLight,
    tabBarBackground: '#1A1625', // always-dark bottom nav
    border: '#EDE9FE',           // violet-100
  },
  dark: {
    text: '#F5F3FF',           // violet-50 — near white
    background: '#13111C',     // very dark violet
    tint: tintColorDark,       // violet-400
    icon: '#A78BFA',           // violet-400
    tabIconDefault: '#6B7280', // gray-500
    tabIconSelected: tintColorDark,
    tabBarBackground: '#13111C', // dark bottom nav
    border: '#2D1F4E',           // dark violet border
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

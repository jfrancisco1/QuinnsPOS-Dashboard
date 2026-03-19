/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Royal blue — professional brand palette (matches screenshot)
const tintColorLight = '#3B55D5'; // royal blue
const tintColorDark = '#7B9EFF';  // light blue for dark mode

export const Colors = {
  light: {
    text: '#111827',           // gray-900
    background: '#FFFFFF',
    tint: tintColorLight,      // royal blue
    icon: '#3B55D5',
    tabIconDefault: '#9CA3AF', // gray-400
    tabIconSelected: tintColorLight,
    tabBarBackground: '#111111', // near-black bottom nav
    border: '#E5E7EB',           // gray-200
    headerBg: '#3B55D5',         // header background
    headerText: '#FFFFFF',
    headerSubtext: '#BFCEFF',    // light blue-white
  },
  dark: {
    text: '#F9FAFB',           // gray-50
    background: '#0F172A',     // slate-900
    tint: tintColorDark,
    icon: '#7B9EFF',
    tabIconDefault: '#6B7280', // gray-500
    tabIconSelected: tintColorDark,
    tabBarBackground: '#0A0A0A', // near-black
    border: '#1E293B',           // slate-800
    headerBg: '#1E2B6B',         // dark blue header
    headerText: '#FFFFFF',
    headerSubtext: '#93AEFF',
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

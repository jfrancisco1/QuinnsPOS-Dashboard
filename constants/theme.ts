/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand primary: deep blue #3B55D5
const tintColorLight = '#3B55D5';
const tintColorDark = '#6B7FEF';

export const Colors = {
  light: {
    text: '#1A1F3C',           // dark navy
    background: '#FFFFFF',     // white
    tint: tintColorLight,
    icon: '#3B55D5',
    tabIconDefault: '#ABABC0', // muted gray
    tabIconSelected: '#3B55D5',
    tabBarBackground: '#FFFFFF', // white bottom nav
    border: '#E8EAF6',
    headerBg: '#FFFFFF',
    headerText: '#1A1F3C',
    headerSubtext: '#8A8FA8',
  },
  dark: {
    text: '#F0F2FF',
    background: '#12142A',
    tint: tintColorDark,
    icon: '#6B7FEF',
    tabIconDefault: '#5A5E7A',
    tabIconSelected: '#6B7FEF',
    tabBarBackground: '#1C1E38',
    border: '#252845',
    headerBg: '#1C1E38',
    headerText: '#F0F2FF',
    headerSubtext: '#7A7F9A',
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

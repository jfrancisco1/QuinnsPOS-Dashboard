/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand primary: indigo #560591
const tintColorLight = '#560591';
const tintColorDark = '#9130F0';

export const Colors = {
  light: {
    text: '#1A1F3C',           // dark navy
    background: '#FFFFFF',     // white
    tint: tintColorLight,
    icon: '#560591',
    tabIconDefault: '#ABABC0', // muted gray
    tabIconSelected: '#560591',
    tabBarBackground: '#FFFFFF', // white bottom nav
    border: '#E8EAF6',
    headerBg: '#560591',
    headerText: '#FFFFFF',
    headerSubtext: '#E4C8FF',
  },
  dark: {
    text: '#F0F2FF',
    background: '#12142A',
    tint: tintColorDark,
    icon: '#9130F0',
    tabIconDefault: '#5A5E7A',
    tabIconSelected: '#9130F0',
    tabBarBackground: '#1C1E38',
    border: '#252845',
    headerBg: '#400070',
    headerText: '#F0F2FF',
    headerSubtext: '#CC96FF',
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

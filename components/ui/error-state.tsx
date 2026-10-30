import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  message: string;
  onRetry: () => void;
};

// Shown when a screen's data failed to load and there's nothing saved to fall
// back on, so a failure never looks like real zeros or an empty list.
export function ErrorState({ message, onRetry }: Props) {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-chip dark:bg-chip-dark">
        <IconSymbol name="exclamationmark.triangle" size={22} color="#8A8FA8" />
      </View>
      <Text className="text-base font-semibold text-ink dark:text-white">Couldn&apos;t load this</Text>
      <Text className="mt-1 text-center text-sm text-muted">{message}</Text>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.8} className="mt-5 rounded-full bg-primary px-6 py-2.5">
        <Text className="text-sm font-semibold text-white">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

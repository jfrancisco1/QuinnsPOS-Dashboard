import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  title: string;
  subtitle?: string;
  onBranchPress: () => void;
  children?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBranchPress, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-primary px-5 pb-5 dark:bg-primary-700" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center">
        <View className="absolute left-0 right-0 items-center">
          <Text className="text-xl font-bold text-white">{title}</Text>
          {subtitle ? (
            <Text className="text-xs font-semibold text-primary-100" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <Text className="text-xs text-primary-200">All Branches</Text>
          )}
        </View>
        <View className="flex-1" />
        <TouchableOpacity
          onPress={onBranchPress}
          activeOpacity={0.75}
          className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
        >
          <IconSymbol name="storefront.fill" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

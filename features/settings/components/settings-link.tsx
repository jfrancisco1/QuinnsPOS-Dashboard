import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function SettingsLink({ title, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center justify-between rounded-3xl bg-white px-5 py-4 dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink dark:text-white">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
      </View>
      <IconSymbol name="chevron.right" size={16} color="#8A8FA8" />
    </TouchableOpacity>
  );
}

import { Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import type { ThemePreference } from '@/context/theme-preference-context';

type Props = {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
};

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

export function AppearanceCard({ preference, onChange }: Props) {
  return (
    <Card title="Appearance">
      <View className="flex-row gap-2">
        {OPTIONS.map((option) => {
          const active = option.key === preference;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChange(option.key)}
              activeOpacity={0.8}
              className={`flex-1 items-center rounded-2xl py-3 ${
                active ? 'bg-primary' : 'bg-page dark:bg-page-dark'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-white' : 'text-subtle dark:text-subtle-dark'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

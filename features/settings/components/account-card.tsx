import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { CurrentUser } from '@/lib/api';

type Props = {
  user: CurrentUser | null;
  loading: boolean;
};

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AccountCard({ user, loading }: Props) {
  return (
    <Card title="Account">
      {loading ? (
        <Text className="text-sm text-muted">Loading account details…</Text>
      ) : user ? (
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-chip dark:bg-chip-dark">
            <IconSymbol name="person.circle.fill" size={28} color="#560591" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink dark:text-white">{user.name}</Text>
            <Text className="text-xs text-muted">@{user.username}</Text>
          </View>
          <View className="rounded-full bg-chip px-2.5 py-1 dark:bg-chip-dark">
            <Text className="text-xs font-semibold text-primary dark:text-primary-300">
              {formatRole(user.role)}
            </Text>
          </View>
        </View>
      ) : (
        <Text className="text-sm text-muted">Unable to load account details.</Text>
      )}
    </Card>
  );
}

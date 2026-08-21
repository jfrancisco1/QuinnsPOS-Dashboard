import { ScrollView, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-preference-context';
import { AccountCard } from '@/features/settings/components/account-card';
import { AppearanceCard } from '@/features/settings/components/appearance-card';
import { SyncCard } from '@/features/settings/components/sync-card';
import { useCurrentUser } from '@/features/settings/hooks/use-current-user';
import { useOrderSync } from '@/features/settings/hooks/use-order-sync';

export default function SettingsScreen() {
  const { token } = useAuth();
  const { user, loading: userLoading } = useCurrentUser({ token });
  const { preference, setThemePreference } = useThemePreference();
  const { status, lastSyncedAt, errorMessage, sync } = useOrderSync({ token });

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader title="Settings" />

      <View className="gap-4 px-5 pb-10 pt-4">
        <AccountCard user={user} loading={userLoading} />
        <AppearanceCard preference={preference} onChange={setThemePreference} />
        <SyncCard
          status={status}
          lastSyncedAt={lastSyncedAt}
          errorMessage={errorMessage}
          onSync={sync}
        />
      </View>
    </ScrollView>
  );
}

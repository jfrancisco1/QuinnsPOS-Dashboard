import { ScrollView, Text, View } from 'react-native';

import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { CurrentPlanCard } from '@/features/plan/components/current-plan-card';
import { UpgradeForm } from '@/features/plan/components/upgrade-form';

export default function PlanScreen() {
  const { token } = useAuth();
  const { tenant } = useAccount();

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark" keyboardShouldPersistTaps="handled">
      <View className="gap-4 px-5 pb-10 pt-4">
        {tenant ? (
          <CurrentPlanCard tenant={tenant} />
        ) : (
          <Text className="text-sm text-muted">Unable to load your plan.</Text>
        )}
        <UpgradeForm token={token} />
      </View>
    </ScrollView>
  );
}

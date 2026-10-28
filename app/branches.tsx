import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UpgradeCard } from '@/components/ui/upgrade-card';
import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { useBranchList } from '@/features/branches/hooks/use-branch-list';
import { isAtLimit } from '@/lib/plan';

export default function BranchesScreen() {
  const { token } = useAuth();
  const { tenant } = useAccount();
  const { branches, loading, error } = useBranchList(token);
  const maxBranches = tenant?.limits.max_branches ?? null;
  const atLimit = !loading && isAtLimit(branches.length, maxBranches);

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <View className="gap-3 px-5 pb-10 pt-4">
        {loading ? (
          <Text className="py-10 text-center text-sm text-muted">Loading...</Text>
        ) : error ? (
          <Text className="py-10 text-center text-sm text-red-500 dark:text-red-400">{error}</Text>
        ) : (
          branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              onPress={() =>
                router.push({
                  pathname: '/edit-branch',
                  params: {
                    id: String(branch.id),
                    name: branch.name,
                    address: branch.address ?? '',
                    phone: branch.phone ?? '',
                    // A shop always keeps at least one branch.
                    can_delete: branches.length > 1 ? '1' : '0',
                  },
                })
              }
              activeOpacity={0.8}
              className="flex-row items-center rounded-2xl bg-white px-4 py-3.5 dark:bg-card-dark"
            >
              <View className="flex-1">
                <Text className="text-sm font-bold text-ink dark:text-white">{branch.name}</Text>
                <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                  {[branch.address, branch.phone].filter(Boolean).join(' · ') || 'No address or phone yet'}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#8A8FA8" />
            </TouchableOpacity>
          ))
        )}

        {!loading && !error ? (
          <>
            <TouchableOpacity
              onPress={() => router.push('/new-branch')}
              disabled={atLimit}
              activeOpacity={0.8}
              className={`mt-2 w-full items-center rounded-xl bg-primary py-3.5${atLimit ? ' opacity-40' : ''}`}
            >
              <Text className="text-sm font-semibold text-white">Add branch</Text>
            </TouchableOpacity>
            {atLimit ? (
              <UpgradeCard
                message={`Your plan allows up to ${maxBranches} branch${maxBranches === 1 ? '' : 'es'}. Upgrade to add more.`}
              />
            ) : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

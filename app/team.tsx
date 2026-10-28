import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { UpgradeCard } from '@/components/ui/upgrade-card';
import { useAuth } from '@/context/auth-context';
import { TeamMemberRow } from '@/features/team/components/team-member-row';
import { useTeam } from '@/features/team/hooks/use-team';
import type { TeamMember } from '@/lib/api';

type Group = { key: string; title: string; members: TeamMember[] };

// Admins have no branch, so they lead as "Owner"; everyone else is grouped by branch.
function groupMembers(members: TeamMember[]): Group[] {
  const groups = new Map<string, Group>();
  for (const member of members) {
    const key = member.branch ? `branch-${member.branch.id}` : 'none';
    const title = member.branch?.name ?? (member.role === 'admin' ? 'Owner' : 'No branch');
    if (!groups.has(key)) groups.set(key, { key, title, members: [] });
    groups.get(key)!.members.push(member);
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.key === 'none' ? -1 : b.key === 'none' ? 1 : a.title.localeCompare(b.title),
  );
}

// Opened from Settings. Available on every plan, including Free after the trial.
export default function TeamScreen() {
  const { token } = useAuth();
  const { members, loading, error, canAddStaff, canAddDriver, driversIncluded, maxStaff } =
    useTeam(token);
  const canAdd = canAddStaff || canAddDriver;
  // Free has no driver accounts, so don't offer them.
  const addLabel = driversIncluded ? 'Add staff or driver' : 'Add staff';

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">

      <View className="gap-4 px-5 pb-10 pt-4">
        {!loading && !error ? (
          <>
            <TouchableOpacity
              onPress={() => router.push('/new-team-member')}
              disabled={!canAdd}
              activeOpacity={0.8}
              className={`w-full items-center rounded-xl bg-primary py-3.5${canAdd ? '' : ' opacity-40'}`}
            >
              {/* Full width: Android can measure bold text too narrow and clip the last word. */}
              <Text className="w-full text-center text-sm font-semibold text-white" numberOfLines={1}>
                {addLabel}
              </Text>
            </TouchableOpacity>
            {!canAdd ? (
              <UpgradeCard
                message={`Your plan allows up to ${maxStaff} staff account${maxStaff === 1 ? '' : 's'}. Upgrade to add more staff and drivers.`}
              />
            ) : null}
          </>
        ) : null}

        {loading ? (
          <Text className="py-10 text-center text-sm text-muted">Loading...</Text>
        ) : error ? (
          <Text className="py-10 text-center text-sm text-red-500 dark:text-red-400">{error}</Text>
        ) : (
          groupMembers(members).map((group) => (
            <View key={group.key} className="overflow-hidden rounded-3xl bg-white pt-4 dark:bg-card-dark">
              <Text className="mb-2 px-4 text-xs font-bold uppercase tracking-widest text-muted">
                {group.title}
              </Text>
              {group.members.map((member) => (
                <TeamMemberRow key={member.id} member={member} />
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

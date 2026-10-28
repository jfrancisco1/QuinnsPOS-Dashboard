import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ROLE_LABELS } from '@/features/team/utils';
import type { TeamMember } from '@/lib/api';

type Props = {
  member: TeamMember;
};

export function TeamMemberRow({ member }: Props) {
  // Admin accounts can only be changed by Quinns POS support.
  const readOnly = member.role === 'admin';

  function openEdit() {
    router.push({
      pathname: '/edit-team-member',
      params: {
        id: String(member.id),
        name: member.name,
        username: member.username,
        role: member.role,
        branch_id: member.branch_id != null ? String(member.branch_id) : '',
        is_active: member.is_active ? '1' : '0',
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      disabled={readOnly}
      activeOpacity={0.75}
      className="flex-row items-center border-t border-divide px-4 py-3 dark:border-divide-dark"
    >
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${member.is_active ? 'text-ink dark:text-white' : 'text-muted'}`}
        >
          {member.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted">@{member.username}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {!member.is_active ? <Badge label="Inactive" variant="warning" /> : null}
        <View className="rounded-full bg-chip px-2.5 py-1 dark:bg-chip-dark">
          <Text className="text-xs font-semibold text-primary dark:text-primary-300">
            {ROLE_LABELS[member.role] ?? member.role}
          </Text>
        </View>
        {readOnly ? (
          <IconSymbol name="lock.fill" size={14} color="#8A8FA8" />
        ) : (
          <IconSymbol name="chevron.right" size={16} color="#8A8FA8" />
        )}
      </View>
    </TouchableOpacity>
  );
}

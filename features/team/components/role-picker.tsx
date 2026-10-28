import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export type PickableRole = 'staff' | 'delivery';

export type RoleOption = {
  role: PickableRole;
  // Why it can't be picked (e.g. the plan's staff limit), or null if it can.
  blockedReason: string | null;
};

const ROLE_COPY: Record<PickableRole, { title: string; body: string }> = {
  staff: { title: 'Staff', body: 'Takes orders at the counter with the Staff app.' },
  delivery: { title: 'Driver', body: 'Does pickups and deliveries with the Driver app.' },
};

type Props = {
  options: RoleOption[];
  value: PickableRole | null;
  onChange: (role: PickableRole) => void;
};

// One tappable card per role, so the owner sees what each one does.
export function RolePicker({ options, value, onChange }: Props) {
  return (
    <View className="gap-2">
      {options.map(({ role, blockedReason }) => {
        const active = role === value;
        const copy = ROLE_COPY[role];
        return (
          <TouchableOpacity
            key={role}
            onPress={() => onChange(role)}
            disabled={blockedReason != null}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: blockedReason != null }}
            className={`flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
              active ? 'border-primary dark:border-primary-400' : 'border-divide dark:border-divide-dark'
            }${blockedReason ? ' opacity-50' : ''}`}
          >
            <IconSymbol
              name={active ? 'checkmark.circle.fill' : 'circle'}
              size={22}
              color={active ? '#560591' : '#8A8FA8'}
            />
            <View className="flex-1">
              <Text className="text-sm font-bold text-ink dark:text-white">{copy.title}</Text>
              <Text className="mt-0.5 text-xs text-subtle dark:text-subtle-dark">
                {blockedReason ?? copy.body}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

import { Text, TouchableOpacity, View } from 'react-native';

export type ChoiceOption<T extends string | number> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string | number> = {
  label?: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

// Single-select row of pill buttons, for short lists (role, branch, billing cycle).
export function ChoiceChips<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  return (
    <View>
      {label ? (
        <Text className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              disabled={option.disabled}
              activeOpacity={0.75}
              className={`rounded-full px-4 py-2 ${
                active ? 'bg-primary' : 'bg-chip dark:bg-chip-dark'
              }${option.disabled ? ' opacity-40' : ''}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-white' : 'text-primary dark:text-primary-300'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

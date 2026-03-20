import { ReactNode } from 'react';
import { Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
  rightIcon?: ReactNode;
};

export function TextInput({ label, rightIcon, ...props }: Props) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </Text>
      <View className="flex-row items-center rounded-lg border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
        <RNTextInput
          placeholderTextColor="#71717a"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 px-4 py-3 text-zinc-900 dark:text-white"
          {...props}
        />
        {rightIcon ? <View className="pr-3">{rightIcon}</View> : null}
      </View>
    </View>
  );
}

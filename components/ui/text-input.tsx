import { Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

export function TextInput({ label, ...props }: Props) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </Text>
      <RNTextInput
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        autoCorrect={false}
        className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        {...props}
      />
    </View>
  );
}

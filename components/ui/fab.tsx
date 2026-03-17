import { Text, TouchableOpacity } from 'react-native';

type Props = {
  onPress: () => void;
};

export function FAB({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-zinc-900 shadow-lg dark:bg-white"
      activeOpacity={0.85}
    >
      <Text className="pb-0.5 text-3xl font-light text-white dark:text-zinc-900">+</Text>
    </TouchableOpacity>
  );
}

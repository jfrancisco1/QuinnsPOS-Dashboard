import { Text, TouchableOpacity } from "react-native";

type Props = {
  onPress: () => void;
};

export function LogoutButton({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="rounded-3xl bg-white px-5 py-4 dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <Text className="text-center text-sm font-bold text-red-500">Log Out</Text>
    </TouchableOpacity>
  );
}

import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useBranch } from '@/context/branch-context';

export function BranchPicker() {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();

  return (
    <View className="border-b border-divide bg-white px-4 py-2.5 dark:border-chip-dark dark:bg-card-dark">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {branches.map((branch) => (
          <TouchableOpacity
            key={branch.id}
            onPress={() => setSelectedBranch(branch)}
            className={`rounded-full px-4 py-1.5 ${
              selectedBranch?.id === branch.id ? 'bg-primary' : 'bg-chip dark:bg-chip-dark'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedBranch?.id === branch.id
                  ? 'text-white'
                  : 'text-subtle dark:text-muted-dark'
              }`}
            >
              {branch.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

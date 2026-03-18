import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useBranch } from '@/context/branch-context';

export function BranchPicker() {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();

  return (
    <View className="border-b border-zinc-100 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        <TouchableOpacity
          onPress={() => setSelectedBranch(null)}
          className={`rounded-full px-3 py-1.5 ${selectedBranch === null ? 'bg-sky-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}
        >
          <Text
            className={`text-xs font-semibold ${selectedBranch === null ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            All
          </Text>
        </TouchableOpacity>

        {branches.map((branch) => (
          <TouchableOpacity
            key={branch.id}
            onPress={() => setSelectedBranch(branch)}
            className={`rounded-full px-3 py-1.5 ${selectedBranch?.id === branch.id ? 'bg-sky-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            <Text
              className={`text-xs font-semibold ${selectedBranch?.id === branch.id ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
            >
              {branch.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useBranch } from '@/context/branch-context';

export function BranchPicker() {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();

  return (
    <View className="border-b border-[#E8EAF6] bg-white px-4 py-2.5 dark:border-[#252845] dark:bg-[#1C1E38]">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {branches.map((branch) => (
          <TouchableOpacity
            key={branch.id}
            onPress={() => setSelectedBranch(branch)}
            className={`rounded-full px-4 py-1.5 ${selectedBranch?.id === branch.id ? 'bg-[#3B55D5]' : 'bg-[#ECEEFF] dark:bg-[#252845]'}`}
          >
            <Text
              className={`text-xs font-semibold ${selectedBranch?.id === branch.id ? 'text-white' : 'text-[#5A5E7A] dark:text-[#9098C0]'}`}
            >
              {branch.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

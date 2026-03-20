import { Modal, Text, TouchableOpacity, View } from 'react-native';

import { useBranch } from '@/context/branch-context';

export type BranchPickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BranchPickerModal({ visible, onClose }: BranchPickerModalProps) {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          className="mx-4 mt-28 rounded-3xl bg-white p-5 dark:bg-card-dark"
          style={{
            shadowColor: '#1A1F3C',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text className="mb-4 text-base font-bold text-ink dark:text-white">
            Select Branch
          </Text>

          {branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              onPress={() => { setSelectedBranch(branch); onClose(); }}
              className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                selectedBranch?.id === branch.id ? 'bg-primary' : 'bg-chip dark:bg-chip-dark'
              }`}
            >
              <Text
                className={`font-semibold ${
                  selectedBranch?.id === branch.id
                    ? 'text-white'
                    : 'text-ink dark:text-subtle-dark'
                }`}
              >
                {branch.name}
              </Text>
              {selectedBranch?.id === branch.id && (
                <View className="h-2 w-2 rounded-full bg-white/80" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

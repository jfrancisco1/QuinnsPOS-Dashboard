import { Modal, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type Period } from '@/lib/date-helpers';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Daily' },
  { key: 'this_week', label: 'Weekly' },
  { key: 'this_month', label: 'Monthly' },
  { key: 'this_year', label: 'Yearly' },
  { key: 'custom', label: 'Custom Range…' },
];

type Props = {
  visible: boolean;
  period: Period;
  onClose: () => void;
  onSelect: (key: Period) => void;
};

export function PeriodPickerModal({ visible, period, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose}>
        <View
          className="mx-4 mt-40 rounded-3xl bg-white p-5 dark:bg-card-dark"
          style={{
            shadowColor: '#1A1F3C',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text className="mb-4 text-base font-bold text-ink dark:text-white">View By</Text>
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => onSelect(opt.key)}
                className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                  isActive ? 'bg-primary' : 'bg-chip dark:bg-chip-dark'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isActive ? 'text-white' : 'text-ink dark:text-subtle-dark'
                  }`}
                >
                  {opt.label}
                </Text>
                {opt.key === 'custom' ? (
                  <IconSymbol
                    name="chevron.right"
                    size={14}
                    color={isActive ? '#fff' : '#8A8FA8'}
                  />
                ) : isActive ? (
                  <View className="h-2 w-2 rounded-full bg-white/80" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

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
  // The Modal's own animation would slide the backdrop along with the sheet, so it's
  // disabled: the backdrop fades and only the sheet slides. The Modal stays mounted
  // until the close animation finishes.
  const [progress] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(() => Dimensions.get('window').height);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black/40" style={{ opacity: progress }}>
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>
        <Animated.View
          className="rounded-t-3xl bg-white px-5 pb-10 pt-3 dark:bg-card-dark"
          style={{ transform: [{ translateY }] }}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        >
          <View className="mb-5 h-1 w-10 self-center rounded-full bg-subtle-dark dark:bg-subtle" />
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
        </Animated.View>
      </View>
    </Modal>
  );
}

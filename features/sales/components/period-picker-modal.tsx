import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: isDark ? '#1C1E38' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#5A5E7A' : '#C8CCF0' }}
    >
      <BottomSheetView className="px-5 pb-10 pt-2">
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
      </BottomSheetView>
    </BottomSheetModal>
  );
}

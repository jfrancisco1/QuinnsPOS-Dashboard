import { TouchableOpacity, View } from 'react-native';

import { ITEM_COLORS } from '@/lib/item-options';

type Props = {
  value: string | null;
  onChange: (color: string | null) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ITEM_COLORS.map((hex) => {
        const selected = value === hex;
        return (
          <TouchableOpacity
            key={hex}
            onPress={() => onChange(selected ? null : hex)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: hex,
              borderWidth: selected ? 3 : 1.5,
              borderColor: selected ? '#560591' : hex,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

import { Text, TouchableOpacity, View } from 'react-native';

import { ITEM_SHAPES, type ItemShape } from '@/lib/item-options';

type Props = {
  value: ItemShape | null;
  color: string | null;
  onChange: (shape: ItemShape | null) => void;
};

export function ShapePicker({ value, color, onChange }: Props) {
  const fillColor = color ?? '#560591';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ITEM_SHAPES.map((s) => {
        const selected = value === s;
        return (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(selected ? null : s)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? '#ECEEFF' : 'transparent',
              borderWidth: 1.5,
              borderColor: selected ? '#560591' : '#E0E2F0',
            }}
          >
            {s === 'circle' && (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: fillColor }} />
            )}
            {s === 'square' && (
              <View style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: fillColor }} />
            )}
            {s === 'star' && (
              <Text style={{ fontSize: 26, color: fillColor, lineHeight: 28 }}>★</Text>
            )}
            {s === 'diamond' && (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 2,
                    backgroundColor: fillColor,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
              </View>
            )}
            <Text style={{ fontSize: 9, marginTop: 4, color: '#8A8FA8', textTransform: 'capitalize' }}>
              {s}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

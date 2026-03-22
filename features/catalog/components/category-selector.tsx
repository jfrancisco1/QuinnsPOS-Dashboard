import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { type Category } from '@/lib/api';

type Props = {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
};

export function CategorySelector({ categories, value, onChange }: Props) {
  const { colorScheme } = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#B060FF' : '#560591';
  if (categories.length === 0) {
    return (
      <Text className="text-sm text-muted">No categories found. Create a category first.</Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {categories.map((cat) => {
          const selected = value === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: selected ? primaryColor : 'transparent',
                borderWidth: 1.5,
                borderColor: primaryColor,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: '500', color: selected ? '#fff' : primaryColor }}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

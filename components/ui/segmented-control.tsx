import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export function SegmentedControl({ options, selectedIndex, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const active = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(index)}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: '#18181b',
  },
  pillInactive: {
    backgroundColor: '#f4f4f5',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: '#ffffff',
  },
  labelInactive: {
    color: '#71717a',
  },
});

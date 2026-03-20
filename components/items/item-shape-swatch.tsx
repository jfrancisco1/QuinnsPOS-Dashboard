import { Text, View } from 'react-native';

export type ItemShapeSwatchProps = {
  color: string;
  shape: string;
};

export function ItemShapeSwatch({ color, shape }: ItemShapeSwatchProps) {
  if (shape === 'circle') {
    return (
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color }} />
    );
  }
  if (shape === 'square') {
    return (
      <View style={{ width: 15, height: 15, borderRadius: 3, backgroundColor: color }} />
    );
  }
  if (shape === 'star') {
    return <Text style={{ fontSize: 21, color, lineHeight: 21 }}>★</Text>;
  }
  if (shape === 'diamond') {
    return (
      <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 13,
            height: 13,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }
  return null;
}

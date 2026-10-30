import { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue } from 'react-native';

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  rounded?: number;
};

// Grey placeholder block that gently pulses while the real content loads.
export function Skeleton({ width = '100%', height, rounded = 8 }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="bg-zinc-200 dark:bg-zinc-800"
      style={{ width, height, borderRadius: rounded, opacity }}
    />
  );
}

// Card-shaped placeholder: a title bar followed by `lines` rows.
export function SkeletonCard({ lines = 3, hero = false }: { lines?: number; hero?: boolean }) {
  return (
    <View className="gap-3 rounded-3xl bg-white px-5 py-5 dark:bg-card-dark">
      <Skeleton width="35%" height={10} />
      {hero && (
        <View className="items-center gap-2 py-2">
          <Skeleton width={64} height={36} />
          <Skeleton width="45%" height={10} />
        </View>
      )}
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} className="flex-row items-center justify-between gap-6 py-1">
          <Skeleton width="40%" height={12} />
          <Skeleton width="22%" height={12} />
        </View>
      ))}
    </View>
  );
}

// List-shaped placeholder for order and expense rows.
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <View className="px-4 pt-2">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row items-center justify-between border-b border-divide py-4 dark:border-divide-dark">
          <View className="flex-1 gap-2 pr-6">
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} />
          </View>
          <View className="items-end gap-2">
            <Skeleton width={72} height={12} />
            <Skeleton width={52} height={16} rounded={999} />
          </View>
        </View>
      ))}
    </View>
  );
}

import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

type ToastVariant = 'success' | 'error';

type Props = {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
};

export function Toast({ message, variant = 'success', visible, onHide, duration = 3000 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className={`absolute bottom-24 left-4 right-4 z-50 rounded-xl px-4 py-3 shadow-lg ${variantStyles[variant]}`}
    >
      <Text className="text-center text-sm font-semibold text-white">{message}</Text>
    </Animated.View>
  );
}

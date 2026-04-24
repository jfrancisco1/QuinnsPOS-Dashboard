import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text } from 'react-native';

import { router } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function SplashScreen() {
  const { token, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minDone || isLoading) return;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace(token ? '/(tabs)' : '/login');
    });
  }, [minDone, isLoading]);

  return (
    <Animated.View
      style={{ flex: 1, opacity: fadeAnim }}
      className="items-center justify-center bg-primary"
    >
      <Image
        source={require('@/assets/images/quinns_logo_white.png')}
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
      />
      <Text style={{ fontFamily: 'Ceoruse', fontSize: 38, color: 'white', marginTop: 16 }}>
        QUINNS
      </Text>
      <Text
        style={{
          fontFamily: 'HelveticaRoundedBold',
          fontSize: 13,
          letterSpacing: 3,
          color: '#d8b4fe',
          marginTop: 4,
        }}
      >
        LAUNDRY MANAGEMENT
      </Text>
      <Text
        style={{
          fontFamily: 'HelveticaRoundedBold',
          fontSize: 13,
          letterSpacing: 3,
          color: '#d8b4fe',
          marginTop: 4,
        }}
      >
        DASHBOARD
      </Text>
    </Animated.View>
  );
}

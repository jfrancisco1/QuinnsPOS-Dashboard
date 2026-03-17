import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(username, password);

    setIsSubmitting(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-zinc-950">
      <Text className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
        Quinns POS Dashboard
      </Text>
      <Text className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to your account
      </Text>

      <View className="w-full gap-4">
        <TextInput
          label="Username"
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          editable={!isSubmitting}
        />

        <TextInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />

        {errorMessage ? (
          <Text className="text-sm text-red-500 dark:text-red-400">{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          className={`mt-2 w-full items-center rounded-lg bg-zinc-900 py-3.5 dark:bg-white${isSubmitting ? ' opacity-50' : ''}`}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Text className="text-sm font-semibold text-white dark:text-zinc-900">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

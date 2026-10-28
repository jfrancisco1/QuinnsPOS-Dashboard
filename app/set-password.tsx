import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { PasswordInput } from '@/components/ui/password-input';
import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { changePassword } from '@/lib/api';

const MIN_LENGTH = 8;

export default function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { token, loginPassword, clearLoginPassword, logout } = useAuth();
  const { user, markPasswordChanged, refresh } = useAccount();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After an app restart the login password is gone, so ask for the temporary one.
  const needsCurrent = loginPassword == null;

  async function handleSubmit() {
    if (!token) return;
    if (needsCurrent && !currentPassword) {
      setError('Enter the temporary password from your welcome email.');
      return;
    }
    if (newPassword.length < MIN_LENGTH) {
      setError(`Your new password needs at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await changePassword(token, {
      current_password: loginPassword ?? currentPassword,
      new_password: newPassword,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    clearLoginPassword();
    markPasswordChanged();
    refresh();
    router.replace('/welcome');
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 gap-4 px-8 pb-8">
          <View className="mb-2">
            <Text className="text-2xl font-bold text-ink dark:text-white">Set your password</Text>
            <Text className="mt-2 text-sm text-subtle dark:text-subtle-dark">
              {user ? `Welcome, ${user.name}. ` : ''}Choose your own password to replace the
              temporary one from your welcome email. You&apos;ll use it to log in from now on.
            </Text>
          </View>

          {needsCurrent ? (
            <PasswordInput
              label="Temporary password"
              placeholder="From your welcome email"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable={!isSubmitting}
            />
          ) : null}
          <PasswordInput
            label="New password"
            placeholder={`At least ${MIN_LENGTH} characters`}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!isSubmitting}
          />
          <PasswordInput
            label="Confirm new password"
            placeholder="Type it again"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isSubmitting}
          />

          {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            className={`mt-2 w-full items-center rounded-lg bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
          >
            <Text className="text-sm font-semibold text-white">
              {isSubmitting ? 'Saving...' : 'Set password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} activeOpacity={0.7} className="items-center py-2">
            <Text className="text-sm text-muted">Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

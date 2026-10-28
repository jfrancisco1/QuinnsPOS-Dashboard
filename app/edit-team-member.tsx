import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { CredentialsCard } from '@/features/team/components/credentials-card';
import { NewPasswordField } from '@/features/team/components/new-password-field';
import { useTeam } from '@/features/team/hooks/use-team';
import { MIN_PASSWORD_LENGTH } from '@/features/team/utils';
import { toggleTeamMember, updateTeamMember } from '@/lib/api';

type Role = 'staff' | 'delivery';

export default function EditTeamMemberScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    username: string;
    role: string;
    branch_id: string;
    is_active: string;
  }>();
  const memberId = Number(params.id);
  const originalRole = params.role === 'delivery' ? 'delivery' : 'staff';
  const isActive = params.is_active !== '0';
  const { branches, driversIncluded } = useTeam(token);

  const [name, setName] = useState(params.name ?? '');
  const [role, setRole] = useState<Role>(originalRole);
  const [branchId, setBranchId] = useState<number | null>(
    params.branch_id ? Number(params.branch_id) : null,
  );
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'save' | 'password' | 'toggle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<string | null>(null);

  async function handleSave() {
    if (!token) return;
    if (!name.trim()) return setError('Name is required.');
    setBusy('save');
    setError(null);
    const result = await updateTeamMember(token, memberId, {
      name: name.trim(),
      role,
      ...(branchId != null ? { branch_id: branchId } : {}),
    });
    setBusy(null);
    if (result.ok) {
      showToast('Changes saved');
      router.back();
    } else {
      setError(result.error.message);
    }
  }

  function handleSetPassword() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setPasswordError(null);
    Alert.alert('Set new password?', "They'll be signed out and need the new password.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Set password',
        onPress: async () => {
          if (!token) return;
          setBusy('password');
          const result = await updateTeamMember(token, memberId, { password });
          setBusy(null);
          if (result.ok) {
            setNewCredentials(password);
          } else {
            setPasswordError(result.error.message);
          }
        },
      },
    ]);
  }

  function handleToggle() {
    const title = isActive ? `Deactivate ${params.name}?` : `Reactivate ${params.name}?`;
    const body = isActive
      ? "They'll be signed out right away and can't log in until you reactivate them."
      : 'They can log in again with their current password.';
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isActive ? 'Deactivate' : 'Reactivate',
        style: isActive ? 'destructive' : 'default',
        onPress: async () => {
          if (!token) return;
          setBusy('toggle');
          const result = await toggleTeamMember(token, memberId);
          setBusy(null);
          if (result.ok) {
            showToast(isActive ? 'Deactivated' : 'Reactivated');
            router.back();
          } else {
            // Reactivating counts against the plan, so this can be a 403 limit message.
            setError(result.error.message);
          }
        },
      },
    ]);
  }

  if (newCredentials) {
    return (
      <ScrollView className="flex-1 bg-page dark:bg-page-dark">
        <View className="p-4">
          <CredentialsCard
            name={name}
            username={params.username ?? ''}
            password={newCredentials}
            role={originalRole}
            onDone={() => router.back()}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark" keyboardShouldPersistTaps="handled">
      <View className="gap-4 p-4">
        <Card title={`@${params.username}`}>
          <View className="gap-4">
            <TextInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <ChoiceChips
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: 'staff', label: 'Staff' },
                // Keep "Driver" visible for someone who already is one, even on Free.
                ...(driversIncluded || originalRole === 'delivery'
                  ? [{ value: 'delivery' as const, label: 'Driver' }]
                  : []),
              ]}
            />
            {branches.length > 1 ? (
              <ChoiceChips
                label="Branch"
                value={branchId}
                onChange={setBranchId}
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
            ) : null}

            {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSave}
              disabled={busy != null}
              activeOpacity={0.8}
              className={`w-full items-center rounded-xl bg-primary py-3.5${busy ? ' opacity-50' : ''}`}
            >
              <Text className="text-sm font-semibold text-white">
                {busy === 'save' ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card title="Password">
          <View className="gap-3">
            <Text className="text-sm text-subtle dark:text-subtle-dark">
              Passwords can&apos;t be shown, only replaced. Setting a new one signs them out on every
              device.
            </Text>
            <NewPasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              editable={busy == null}
            />
            {passwordError ? (
              <Text className="text-sm text-red-500 dark:text-red-400">{passwordError}</Text>
            ) : null}
            <TouchableOpacity
              onPress={handleSetPassword}
              disabled={busy != null}
              activeOpacity={0.8}
              className={`w-full items-center rounded-xl bg-chip py-3.5 dark:bg-chip-dark${busy ? ' opacity-50' : ''}`}
            >
              <Text className="text-sm font-semibold text-primary dark:text-primary-300">
                {busy === 'password' ? 'Setting...' : 'Set new password'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card title="Account">
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald' : 'bg-red-500'}`} />
              <Text className="text-sm font-bold text-ink dark:text-white">
                {isActive ? 'Active' : 'Deactivated'}
              </Text>
            </View>
            <Text className="text-sm text-subtle dark:text-subtle-dark">
              {isActive
                ? `Deactivate ${params.name} when they leave. They're signed out right away and can't log in, but their past orders stay.`
                : `${params.name} can't log in. Reactivate to let them back in with their current password.`}
            </Text>
            <TouchableOpacity
              onPress={handleToggle}
              disabled={busy != null}
              activeOpacity={0.8}
              className={`w-full items-center rounded-xl py-3.5 ${isActive ? 'bg-red-500' : 'bg-emerald'}${
                busy ? ' opacity-50' : ''
              }`}
            >
              <Text className="w-full text-center text-sm font-bold text-white" numberOfLines={1}>
                {busy === 'toggle'
                  ? 'Working...'
                  : isActive
                    ? `Deactivate ${params.name}`
                    : `Reactivate ${params.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { TextInput } from '@/components/ui/text-input';
import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { CredentialsCard } from '@/features/team/components/credentials-card';
import { NewPasswordField } from '@/features/team/components/new-password-field';
import { RolePicker, type PickableRole, type RoleOption } from '@/features/team/components/role-picker';
import { useTeam } from '@/features/team/hooks/use-team';
import {
  accountPlaceholders,
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  suggestUsername,
} from '@/features/team/utils';
import { createTeamMember } from '@/lib/api';

export default function NewTeamMemberScreen() {
  const { token } = useAuth();
  const { tenant } = useAccount();
  const {
    branches,
    canAddStaff,
    canAddDriver,
    canAddAdmin,
    driversIncluded,
    isOwner,
    maxStaff,
    maxDrivers,
  } = useTeam(token);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  // Keep suggesting "{branch}.{name}" until the owner types their own username.
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [role, setRole] = useState<PickableRole | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    username: string;
    password: string;
    role: PickableRole;
  } | null>(null);

  const roleOptions: RoleOption[] = [
    {
      role: 'staff',
      blockedReason: canAddStaff
        ? null
        : `Your plan allows ${maxStaff} staff account${maxStaff === 1 ? '' : 's'}. Upgrade to add more.`,
    },
    // Drivers aren't included on Free (max_drivers = 0), so the role is hidden there.
    ...(driversIncluded
      ? [
          {
            role: 'delivery' as const,
            blockedReason: canAddDriver
              ? null
              : `Your plan allows ${maxDrivers} driver account${maxDrivers === 1 ? '' : 's'}.`,
          },
        ]
      : []),
    // Only the owner adds admins; Free and Starter allow just the owner.
    ...(isOwner
      ? [
          {
            role: 'admin' as const,
            blockedReason: canAddAdmin ? null : 'Pro lets you add more admins. Upgrade to add one.',
          },
        ]
      : []),
  ];

  // Default to the only branch / the first role that's allowed.
  const effectiveBranchId = branchId ?? (branches.length === 1 ? branches[0].id : null);
  const effectiveRole = role ?? roleOptions.find((o) => o.blockedReason == null)?.role ?? null;
  // Admins see every branch, so they get no branch and usernames start with the shop name.
  const isAdmin = effectiveRole === 'admin';
  const branchName = branches.find((b) => b.id === effectiveBranchId)?.name;
  const prefix = isAdmin ? tenant?.name : branchName;
  const effectiveUsername = usernameEdited ? username : suggestUsername(prefix, name);
  const roleLabel = effectiveRole === 'delivery' ? 'driver' : isAdmin ? 'admin' : 'staff';
  const placeholders = accountPlaceholders(prefix, effectiveRole);

  const canSubmit =
    name.trim() !== '' &&
    effectiveUsername !== '' &&
    effectiveRole != null &&
    (isAdmin || effectiveBranchId != null) &&
    password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit() {
    if (!token || !canSubmit || effectiveRole == null) return;
    setIsSubmitting(true);
    setError(null);
    const result = await createTeamMember(token, {
      name: name.trim(),
      username: effectiveUsername,
      password,
      role: effectiveRole,
      ...(!isAdmin && effectiveBranchId != null ? { branch_id: effectiveBranchId } : {}),
    });
    setIsSubmitting(false);
    if (result.ok) {
      setCreated({ name: result.data.name, username: result.data.username, password, role: effectiveRole });
    } else {
      // e.g. 403 plan limit or 422 username taken, shown as the API words it.
      setError(result.error.message);
    }
  }

  if (created) {
    return (
      <ScrollView className="flex-1 bg-page dark:bg-page-dark">
        <View className="p-4">
          <CredentialsCard {...created} onDone={() => router.back()} />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card title="Role">
          <RolePicker options={roleOptions} value={effectiveRole} onChange={setRole} />
          {isAdmin ? (
            <Text className="mt-3 text-xs text-muted">Sees every branch</Text>
          ) : branches.length > 1 ? (
            <View className="mt-4">
              <ChoiceChips
                label="Branch"
                value={effectiveBranchId}
                onChange={setBranchId}
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
            </View>
          ) : branchName ? (
            <Text className="mt-3 text-xs text-muted">Works at {branchName}</Text>
          ) : null}
        </Card>

        <Card title="Details">
          <View className="gap-4">
            <TextInput
              label="Name"
              placeholder={`e.g. ${placeholders.name}`}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
            <View>
              <TextInput
                label="Username"
                placeholder={`e.g. ${placeholders.username}`}
                value={effectiveUsername}
                onChangeText={(value) => {
                  setUsernameEdited(true);
                  setUsername(normalizeUsername(value));
                }}
              />
              <Text className="mt-1.5 text-xs text-muted">
                What they type to log in. Lowercase, no spaces.
              </Text>
            </View>
          </View>
        </Card>

        <Card title="Password">
          <NewPasswordField label="Password" value={password} onChange={setPassword} />
          <Text className="mt-3 text-xs text-muted">
            You choose it and give it to them. They log in with it directly, and you can set a new one
            any time.
          </Text>
        </Card>

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          activeOpacity={0.8}
          className={`mb-4 w-full items-center rounded-xl bg-primary py-4${
            !canSubmit || isSubmitting ? ' opacity-50' : ''
          }`}
        >
          <Text className="w-full text-center text-sm font-semibold text-white" numberOfLines={1}>
            {isSubmitting ? 'Adding...' : `Add ${roleLabel} account`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

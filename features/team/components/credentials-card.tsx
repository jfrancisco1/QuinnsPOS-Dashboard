import { Linking, Share, Text, TouchableOpacity, View } from 'react-native';

import * as Clipboard from 'expo-clipboard';

import { Card } from '@/components/ui/card';
import { useToast } from '@/context/toast-context';
import { DRIVER_APP_URL, STAFF_APP_URL } from '@/lib/plan';

type Props = {
  name: string;
  username: string;
  password: string;
  role: 'staff' | 'delivery';
  onDone: () => void;
};

// Shown right after creating an account or setting its password. The API never
// returns passwords, so this is the only time the owner sees it.
export function CredentialsCard({ name, username, password, role, onDone }: Props) {
  const { showToast } = useToast();
  const appName = role === 'delivery' ? 'Driver app' : 'Staff app';
  const appUrl = role === 'delivery' ? DRIVER_APP_URL : STAFF_APP_URL;
  const text = `Quinns POS ${appName} login for ${name}\nUsername: ${username}\nPassword: ${password}${
    appUrl ? `\nGet the app: ${appUrl}` : ''
  }`;

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    showToast('Copied');
  }

  return (
    <Card title={`${name}'s login`}>
      <View className="gap-3">
        <Field label="Username" value={username} />
        <Field label="Password" value={password} />

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleCopy}
            activeOpacity={0.8}
            className="flex-1 items-center rounded-xl bg-chip py-3 dark:bg-chip-dark"
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-300">Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Share.share({ message: text })}
            activeOpacity={0.8}
            className="flex-1 items-center rounded-xl bg-chip py-3 dark:bg-chip-dark"
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-300">Share</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-subtle dark:text-subtle-dark">
          {role === 'delivery'
            ? "Type this into the Driver app on the driver's phone."
            : 'Type this into the Staff app on your counter tablet.'}
        </Text>

        {appUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(appUrl)}
            activeOpacity={0.8}
            className="items-center rounded-xl border-2 border-primary py-3 dark:border-primary-400"
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-300">
              Get the {appName}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-xs text-muted">The {appName} is coming soon to the Play Store.</Text>
        )}

        <Text className="text-xs text-muted">
          You won&apos;t see this password again, but you can set a new one any time from Team.
        </Text>

        <TouchableOpacity
          onPress={onDone}
          activeOpacity={0.8}
          className="mt-1 w-full items-center rounded-xl bg-primary py-3.5"
        >
          <Text className="text-sm font-semibold text-white">Done</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl bg-page px-4 py-3 dark:bg-page-dark">
      <Text className="text-xs text-muted">{label}</Text>
      <Text selectable className="mt-0.5 font-mono text-lg font-bold text-ink dark:text-white">
        {value}
      </Text>
    </View>
  );
}

import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PasswordInput } from '@/components/ui/password-input';
import { MIN_PASSWORD_LENGTH, suggestPassword } from '@/features/team/utils';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
};

// Password the owner chooses for a staff member or driver, with an optional
// suggestion filled in on the device (nothing is generated server-side).
export function NewPasswordField({ label, value, onChange, editable = true }: Props) {
  const [visible, setVisible] = useState(false);
  const longEnough = value.length >= MIN_PASSWORD_LENGTH;

  function handleSuggest() {
    onChange(suggestPassword());
    // Show it, since the owner has to read it out or type it on the tablet.
    setVisible(true);
  }

  return (
    <View>
      <PasswordInput
        label={label}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={value}
        onChangeText={onChange}
        editable={editable}
        visible={visible}
        onVisibleChange={setVisible}
      />
      <View className="mt-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <IconSymbol
            name={longEnough ? 'checkmark.circle.fill' : 'circle'}
            size={14}
            color={longEnough ? '#10B981' : '#8A8FA8'}
          />
          <Text className={`text-xs ${longEnough ? 'text-emerald' : 'text-muted'}`}>
            {MIN_PASSWORD_LENGTH}+ characters
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSuggest}
          disabled={!editable}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 py-1"
        >
          <IconSymbol name="sparkles" size={14} color="#560591" />
          <Text className="text-xs font-semibold text-primary dark:text-primary-300">
            Suggest a password
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

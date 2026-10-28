import { useState } from 'react';
import { TextInputProps, TouchableOpacity } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { TextInput } from '@/components/ui/text-input';

type Props = TextInputProps & {
  label: string;
  // Optionally controlled, e.g. to reveal a password the app just suggested.
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

// TextInput with a show/hide toggle.
export function PasswordInput({ label, visible, onVisibleChange, ...props }: Props) {
  const [ownVisible, setOwnVisible] = useState(false);
  const isVisible = visible ?? ownVisible;
  const setVisible = onVisibleChange ?? setOwnVisible;
  return (
    <TextInput
      label={label}
      secureTextEntry={!isVisible}
      rightIcon={
        <TouchableOpacity onPress={() => setVisible(!isVisible)} activeOpacity={0.7}>
          <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717a" />
        </TouchableOpacity>
      }
      {...props}
    />
  );
}

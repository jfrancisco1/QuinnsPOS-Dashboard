import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/context/toast-context';
import { updateStore, type Store } from '@/lib/api';

type Props = {
  store: Store | null;
  loading: boolean;
  token: string | null;
  canEdit: boolean;
  onSaved: (store: Store) => void;
};

export function StoreCard({ store, loading, token, canEdit, onSaved }: Props) {
  const { showToast } = useToast();
  const seeded = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store && !seeded.current) {
      seeded.current = true;
      setName(store.name ?? '');
      setEmail(store.email ?? '');
      setPhone(store.phone ?? '');
      setAddress(store.address ?? '');
      setGcashNumber(store.gcash_number ?? '');
    }
  }, [store]);

  async function handleSave() {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    const result = await updateStore(token, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gcash_number: gcashNumber.trim(),
    });
    setIsSaving(false);
    if (result.ok) {
      showToast('Store details saved');
      onSaved(result.data);
    } else {
      setError(result.error.message);
    }
  }

  if (loading) {
    return (
      <Card title="Store">
        <Text className="text-sm text-muted">Loading store details…</Text>
      </Card>
    );
  }

  if (!store) {
    return (
      <Card title="Store">
        <Text className="text-sm text-muted">Unable to load store details.</Text>
      </Card>
    );
  }

  if (!canEdit) {
    return (
      <Card title="Store">
        <View className="gap-1">
          <Text className="text-base font-bold text-ink dark:text-white">{store.name ?? '—'}</Text>
          {!!store.address && <Text className="text-sm text-muted">{store.address}</Text>}
          {!!store.phone && <Text className="text-sm text-muted">{store.phone}</Text>}
          {!!store.email && <Text className="text-sm text-muted">{store.email}</Text>}
        </View>
      </Card>
    );
  }

  return (
    <Card title="Store">
      <View className="gap-3">
        <TextInput label="Business Name" placeholder="e.g. Quinn's Laundry" value={name} onChangeText={setName} />
        <TextInput
          label="Email"
          placeholder="store@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          label="Phone"
          placeholder="e.g. 0917 000 0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput label="Address" placeholder="Store address" value={address} onChangeText={setAddress} />
        <TextInput
          label="GCash Number"
          placeholder="e.g. 0917 000 0000"
          value={gcashNumber}
          onChangeText={setGcashNumber}
          keyboardType="phone-pad"
        />

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSaving ? ' opacity-50' : ''}`}
        >
          <Text className="text-sm font-semibold text-white">{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

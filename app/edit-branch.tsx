import { useState } from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { useToast } from '@/context/toast-context';
import { BranchForm } from '@/features/branches/components/branch-form';
import { deleteBranch, getOrders, updateBranch, updateOnboarding } from '@/lib/api';

export default function EditBranchScreen() {
  const { token } = useAuth();
  const { loadBranches, selectedBranch, setSelectedBranch } = useBranch();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    address: string;
    phone: string;
    can_delete: string;
  }>();
  const branchId = Number(params.id);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!token) return;
    // Deleting cascades to the branch's orders in the database, so a branch
    // with any history can't be deleted from the app.
    setIsDeleting(true);
    const orders = await getOrders(token, { branch_id: branchId });
    setIsDeleting(false);
    if (!orders.ok) {
      Alert.alert("Couldn't check this branch", orders.error.message);
      return;
    }
    if (orders.data.data.length > 0) {
      Alert.alert(
        "Can't delete this branch",
        `${params.name} has orders. Deleting it would delete them too, so it can't be deleted from the app.`,
      );
      return;
    }
    Alert.alert(
      `Delete ${params.name}?`,
      'This permanently deletes the branch with its price list, expenses and the customers first registered there. Staff assigned to it will have no branch. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    if (!token) return;
    setIsDeleting(true);
    const result = await deleteBranch(token, branchId);
    setIsDeleting(false);
    if (!result.ok) {
      Alert.alert("Couldn't delete the branch", result.error.message);
      return;
    }
    if (selectedBranch?.id === branchId) setSelectedBranch(null);
    loadBranches(token);
    showToast('Branch deleted');
    router.back();
  }

  return (
    <BranchForm
      initial={{ name: params.name ?? '', address: params.address ?? '', phone: params.phone ?? '' }}
      submitLabel="Save Changes"
      onSubmit={(data) => updateBranch(token!, branchId, data)}
      onSaved={() => {
        // Saving the branch ticks "Check your branch" on the setup checklist.
        if (token) {
          updateOnboarding(token, 'branch', true);
          loadBranches(token);
        }
        showToast('Branch saved');
        router.back();
      }}
      footer={
        params.can_delete === '1' ? (
          <TouchableOpacity
            onPress={confirmDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
            className={`w-full items-center rounded-lg border border-red-500 py-3.5${isDeleting ? ' opacity-50' : ''}`}
          >
            <Text className="text-sm font-semibold text-red-500">
              {isDeleting ? 'Checking...' : 'Delete Branch'}
            </Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

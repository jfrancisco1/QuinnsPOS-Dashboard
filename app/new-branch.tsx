import { router } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { useToast } from '@/context/toast-context';
import { BranchForm } from '@/features/branches/components/branch-form';
import { createBranch } from '@/lib/api';

export default function NewBranchScreen() {
  const { token } = useAuth();
  const { loadBranches } = useBranch();
  const { showToast } = useToast();

  return (
    <BranchForm
      submitLabel="Add Branch"
      onSubmit={(data) => createBranch(token!, data)}
      onSaved={() => {
        if (token) loadBranches(token);
        showToast('Branch added');
        router.back();
      }}
    />
  );
}

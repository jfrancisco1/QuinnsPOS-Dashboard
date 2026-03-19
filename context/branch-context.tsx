import React, { createContext, useCallback, useContext, useState } from 'react';

import { getBranches, type Branch } from '@/lib/api';

type BranchContextValue = {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  loadBranches: (token: string) => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const loadBranches = useCallback(async (token: string) => {
    const result = await getBranches(token);
    if (!result.ok) return;
    const active = result.data
      .filter((b) => b.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
    setBranches(active);
    if (active.length === 1) {
      setSelectedBranch(active[0]);
    }
  }, []);

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, setSelectedBranch, loadBranches }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (ctx === undefined) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}

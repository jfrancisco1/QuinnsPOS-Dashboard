import React, { createContext, useCallback, useContext, useState } from 'react';

import type { Branch, Order } from '@/lib/api';

type BranchContextValue = {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  syncBranchesFromOrders: (orders: Order[]) => void;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const syncBranchesFromOrders = useCallback((orders: Order[]) => {
    const seen = new Set<number>();
    const next: Branch[] = [];
    for (const order of orders) {
      if (order.branch && !seen.has(order.branch.id)) {
        seen.add(order.branch.id);
        next.push(order.branch);
      }
    }
    next.sort((a, b) => a.name.localeCompare(b.name));
    console.log('[BranchContext] orders:', orders.length, 'branches found:', next.map(b => b.name));
    setBranches(next);
  }, []);

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, setSelectedBranch, syncBranchesFromOrders }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (ctx === undefined) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}

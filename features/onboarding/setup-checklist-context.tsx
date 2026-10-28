import React, { createContext, useCallback, useContext, useState } from 'react';

import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  getOnboarding,
  updateOnboarding,
  type OnboardingStatus,
  type OnboardingStep,
} from '@/lib/api';

export type ChecklistStepKey = OnboardingStep;

// GET /onboarding: hand ticks (stored on the shop, so they survive reinstalls
// and match on every device) plus the shop's progress from its data.
export type ChecklistState = OnboardingStatus;

export type SetupStatus = 'loading' | 'active' | 'done';

// Whether the shop's data alone completes a step (branch and prices have no signal).
export function isDoneByData(c: ChecklistState, step: ChecklistStepKey): boolean {
  switch (step) {
    case 'staff':
      return c.has_staff;
    case 'driver':
      return c.has_driver;
    case 'order':
      return c.has_order;
    default:
      return false;
  }
}

export function isStepDone(c: ChecklistState, step: ChecklistStepKey): boolean {
  return c.ticked[step] || isDoneByData(c, step);
}

// Required steps only; adding a driver is optional. The branch step is part of
// the full app only, since Free hides branches.
function isComplete(c: ChecklistState, hasFullApp: boolean): boolean {
  const required: ChecklistStepKey[] = ['prices', 'staff', 'order'];
  if (hasFullApp) required.push('branch');
  return required.every((step) => isStepDone(c, step));
}

type SetupChecklistContextValue = {
  checklist: ChecklistState | null;
  // 'active' while setup is unfinished and not dismissed: home shows only the
  // checklist and the tab bar drops Orders and Expenses.
  status: SetupStatus;
  // Ticks or unticks a step by hand. A step its data already completes stays ticked.
  setStepDone: (step: ChecklistStepKey, done: boolean) => Promise<void>;
  dismiss: () => Promise<void>;
  reload: () => Promise<void>;
};

const SetupChecklistContext = createContext<SetupChecklistContextValue | undefined>(undefined);

type Loaded = { token: string; data: ChecklistState | null };

// Shared by the tab bar and the home screen, loaded via reload(). Home (the
// first tab) calls it on focus, which covers the first load and picks up steps
// finished elsewhere (saving the branch or an item ticks them on the server).
export function SetupChecklistProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { tenant, hasFullApp } = useAccount();
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    const res = await getOnboarding(token);
    setLoaded((prev) =>
      // Keep the last known checklist if a refresh fails (e.g. offline, nothing cached).
      res.ok || prev?.token !== token ? { token, data: res.ok ? res.data : null } : prev,
    );
  }, [token]);

  const save = useCallback(
    async (step: ChecklistStepKey | 'dismissed', done: boolean) => {
      if (!token) return;
      // Show the tick right away; the server's answer replaces it.
      setLoaded((prev) =>
        prev?.token === token && prev.data
          ? { token, data: { ...prev.data, ticked: { ...prev.data.ticked, [step]: done } } }
          : prev,
      );
      const res = await updateOnboarding(token, step, done);
      if (res.ok) {
        setLoaded({ token, data: res.data });
      } else {
        showToast(res.error.message, 'error');
        await reload();
      }
    },
    [token, showToast, reload],
  );

  const setStepDone = useCallback(
    (step: ChecklistStepKey, done: boolean) => save(step, done),
    [save],
  );
  const dismiss = useCallback(() => save('dismissed', true), [save]);

  const current = token != null && loaded?.token === token ? loaded : null;
  const checklist = current?.data ?? null;
  // No tenant (e.g. /me failed), or the checklist can't be loaded: nothing to
  // set up against, so don't hold the home screen on it.
  const status: SetupStatus =
    tenant == null || (current != null && checklist == null)
      ? 'done'
      : !checklist
        ? 'loading'
        : checklist.ticked.dismissed || isComplete(checklist, hasFullApp)
          ? 'done'
          : 'active';

  return (
    <SetupChecklistContext.Provider value={{ checklist, status, setStepDone, dismiss, reload }}>
      {children}
    </SetupChecklistContext.Provider>
  );
}

export function useSetupChecklist(): SetupChecklistContextValue {
  const ctx = useContext(SetupChecklistContext);
  if (ctx === undefined) throw new Error('useSetupChecklist must be used within SetupChecklistProvider');
  return ctx;
}

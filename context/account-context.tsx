import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { getMe, type CurrentUser, type Tenant } from '@/lib/api';
import { getPreference, setPreference } from '@/lib/preferences-store';

const FULL_APP_FEATURE = 'admin_app';

function freeNoticeKey(tenantId: number) {
  return `free_notice_seen_${tenantId}`;
}

type AccountContextValue = {
  user: CurrentUser | null;
  tenant: Tenant | null;
  loading: boolean;
  // The only plan check in the app: Starter, Pro, or a shop on its trial.
  // Without it (Free after the trial) only Team, Prices, Upgrade and Settings show.
  hasFullApp: boolean;
  // The trial has ended and the owner hasn't seen the one-time "You're now on Free" screen.
  freeNoticePending: boolean;
  dismissFreeNotice: () => Promise<void>;
  markPasswordChanged: () => void;
  refresh: () => Promise<void>;
};

type LoadedAccount = {
  token: string;
  user: CurrentUser | null;
  freeNoticeSeen: boolean;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  // Tagged with the token it was fetched for so `loading` can be derived.
  const [loaded, setLoaded] = useState<LoadedAccount | null>(null);

  const fetchAccount = useCallback(async (forToken: string) => {
    const res = await getMe(forToken);
    const user = res.ok ? res.data : null;
    const tenantId = user?.tenant?.id;
    const freeNoticeSeen =
      tenantId != null && (await getPreference(freeNoticeKey(tenantId))) === '1';
    setLoaded((prev) => {
      // A failed refresh (e.g. offline with nothing cached) keeps the last known account.
      if (!user && prev?.token === forToken) return prev;
      return { token: forToken, user, freeNoticeSeen };
    });
  }, []);

  useEffect(() => {
    if (token) fetchAccount(token);
  }, [token, fetchAccount]);

  // Re-check the plan on resume, so a trial that ended or an upgrade that was
  // recorded while the app was in the background takes effect.
  useEffect(() => {
    if (!token) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchAccount(token);
    });
    return () => sub.remove();
  }, [token, fetchAccount]);

  const current = token != null && loaded?.token === token ? loaded : null;
  const user = current?.user ?? null;
  const tenant = user?.tenant ?? null;
  // If /me couldn't be loaded at all, fall back to the full app: the API still
  // enforces the plan, and its 403 messages are shown as-is.
  const hasFullApp = tenant ? tenant.features.includes(FULL_APP_FEATURE) : true;
  const freeNoticePending =
    tenant != null &&
    !hasFullApp &&
    !tenant.on_trial &&
    tenant.trial_ends_at != null &&
    !current?.freeNoticeSeen;

  const dismissFreeNotice = useCallback(async () => {
    if (!tenant) return;
    await setPreference(freeNoticeKey(tenant.id), '1');
    setLoaded((prev) => (prev ? { ...prev, freeNoticeSeen: true } : prev));
  }, [tenant]);

  const markPasswordChanged = useCallback(() => {
    setLoaded((prev) =>
      prev?.user ? { ...prev, user: { ...prev.user, must_change_password: false } } : prev,
    );
  }, []);

  const refresh = useCallback(async () => {
    if (token) await fetchAccount(token);
  }, [token, fetchAccount]);

  return (
    <AccountContext.Provider
      value={{
        user,
        tenant,
        loading: token != null && current == null,
        hasFullApp,
        freeNoticePending,
        dismissFreeNotice,
        markPasswordChanged,
        refresh,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (ctx === undefined) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}

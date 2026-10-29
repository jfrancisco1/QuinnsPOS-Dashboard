import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { useAccount } from '@/context/account-context';
import { getBranches, getTeamMembers, type Branch, type TeamMember } from '@/lib/api';
import { isAtLimit } from '@/lib/plan';

type Loaded = {
  token: string;
  members: TeamMember[];
  branches: Branch[];
  error: string | null;
};

// Team members and branches, reloaded on focus, plus what the plan allows adding.
export function useTeam(token: string | null) {
  const { user, tenant } = useAccount();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    const [members, branches] = await Promise.all([getTeamMembers(token), getBranches(token)]);
    setLoaded({
      token,
      members: members.ok ? members.data : [],
      branches: branches.ok ? branches.data.filter((b) => b.is_active) : [],
      error: members.ok ? null : members.error.message,
    });
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const current = token != null && loaded?.token === token ? loaded : null;
  const members = current?.members ?? [];
  const limits = tenant?.limits;
  // Only active accounts count toward the limits; null means unlimited.
  const activeStaff = members.filter((m) => m.is_active && m.role === 'staff').length;
  const activeDrivers = members.filter((m) => m.is_active && m.role === 'delivery').length;
  const canAddStaff = !isAtLimit(activeStaff, limits?.max_staff ?? null);
  const driversIncluded = limits?.max_drivers !== 0;
  const canAddDriver = driversIncluded && !isAtLimit(activeDrivers, limits?.max_drivers ?? null);
  // Only the owner adds admins. Free and Starter allow one admin (the owner), Pro unlimited.
  const isOwner = user?.is_owner === true;
  const activeAdmins = members.filter((m) => m.is_active && m.role === 'admin').length;
  const canAddAdmin = isOwner && !isAtLimit(activeAdmins, limits?.max_admins ?? null);

  return {
    members,
    branches: current?.branches ?? [],
    error: current?.error ?? null,
    loading: token != null && current == null,
    reload,
    maxStaff: limits?.max_staff ?? null,
    maxDrivers: limits?.max_drivers ?? null,
    canAddStaff,
    canAddDriver,
    driversIncluded,
    isOwner,
    canAddAdmin,
  };
}

import { ScrollView, View } from "react-native";

import { router } from "expo-router";

import { ScreenHeader } from "@/components/ui/screen-header";
import { useAccount } from "@/context/account-context";
import { useAuth } from "@/context/auth-context";
import { useThemePreference } from "@/context/theme-preference-context";
import { AccountCard } from "@/features/settings/components/account-card";
import { AppearanceCard } from "@/features/settings/components/appearance-card";
import { LogoutButton } from "@/features/settings/components/logout-button";
import { SettingsLink } from "@/features/settings/components/settings-link";
import { StoreCard } from "@/features/settings/components/store-card";
import { useCurrentUser } from "@/features/settings/hooks/use-current-user";
import { useOrderSync } from "@/features/settings/hooks/use-order-sync";
import { useStore } from "@/features/settings/hooks/use-store";
import { planLabel, trialDaysLeft } from "@/lib/plan";

export default function SettingsScreen() {
  const { token, logout } = useAuth();
  const { user, loading: userLoading } = useCurrentUser({ token });
  const { preference, setThemePreference } = useThemePreference();
  const { status, lastSyncedAt, errorMessage, sync } = useOrderSync({ token });
  const { store, loading: storeLoading, setStore } = useStore({ token });
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const { tenant, hasFullApp } = useAccount();
  const planSubtitle = tenant
    ? tenant.on_trial
      ? `${planLabel(tenant.plan)} · Pro trial, ${trialDaysLeft(tenant)} days left`
      : planLabel(tenant.plan)
    : undefined;

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader title="Settings" />

      <View className="gap-4 px-5 pb-10 pt-4">
        <AccountCard user={user} loading={userLoading} />
        <AppearanceCard preference={preference} onChange={setThemePreference} />
        {/* Team is on every plan, including Free. */}
        <SettingsLink
          title="Team"
          subtitle="Staff and driver logins and passwords"
          onPress={() => router.push("/team")}
        />
        <SettingsLink
          title="Plan"
          subtitle={planSubtitle}
          onPress={() => router.push("/plan")}
        />
        {/* Store settings and branches are part of the full app; Free keeps Team and Prices. */}
        {hasFullApp ? (
          <>
            <SettingsLink
              title="Branches"
              subtitle="Names, addresses and phone numbers"
              onPress={() => router.push("/branches")}
            />
            <StoreCard
              store={store}
              loading={storeLoading}
              token={token}
              canEdit={isAdmin}
              onSaved={setStore}
            />
          </>
        ) : null}
        {/* <SyncCard
          status={status}
          lastSyncedAt={lastSyncedAt}
          errorMessage={errorMessage}
          onSync={sync}
        /> */}
        <LogoutButton onPress={logout} />
      </View>
    </ScrollView>
  );
}

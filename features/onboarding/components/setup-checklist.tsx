import { useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/context/account-context';
import {
  isDoneByData,
  isStepDone,
  type ChecklistState,
  type ChecklistStepKey,
} from '@/features/onboarding/setup-checklist-context';
import { STAFF_APP_URL } from '@/lib/plan';

type Step = {
  key: ChecklistStepKey;
  title: string;
  description: string;
  done: boolean;
  // Done because of the shop's data (e.g. a staff account exists), so the
  // owner can't untick it.
  doneByData: boolean;
  optional?: boolean;
  actionLabel: string;
  onAction: () => void;
};

type StepCopy = Omit<Step, 'done' | 'doneByData'>;

function buildSteps(c: ChecklistState, opts: { showBranch: boolean; showDriver: boolean }): Step[] {
  const copy: StepCopy[] = [];
  if (opts.showBranch) {
    copy.push({
      key: 'branch',
      title: 'Check your branch',
      description: 'Confirm or edit the branch name, address and phone.',
      actionLabel: 'Open branches',
      onAction: () => router.push('/branches'),
    });
  }
  copy.push(
    {
      key: 'prices',
      title: 'Check your prices',
      description:
        "The items are examples. Edit prices, remove what you don't offer, and add your other services.",
      actionLabel: 'Open prices',
      onAction: () => router.push('/(tabs)/items'),
    },
    {
      key: 'staff',
      title: 'Add your staff',
      description: 'Create a staff account with a password you choose, for the counter tablet.',
      actionLabel: 'Open team',
      onAction: () => router.push('/team'),
    },
  );
  if (opts.showDriver) {
    copy.push({
      key: 'driver',
      title: 'Add a driver',
      description: 'For pickups and deliveries.',
      optional: true,
      actionLabel: 'Open team',
      onAction: () => router.push('/team'),
    });
  }
  copy.push({
    key: 'order',
    title: 'Take your first order',
    description:
      'Install the Staff app on the counter tablet and log in with the staff account and the password you set.',
    actionLabel: 'Get the Staff app',
    onAction: () => Linking.openURL(STAFF_APP_URL),
  });
  return copy.map((step) => ({
    ...step,
    done: isStepDone(c, step.key),
    doneByData: isDoneByData(c, step.key),
  }));
}

type Props = {
  checklist: ChecklistState;
  onToggle: (step: ChecklistStepKey, done: boolean) => void;
  onDismiss: () => void;
  className?: string;
};

// The home screen shows only this until every required step is done or it's
// dismissed (see SetupChecklistProvider's status). The circle ticks a step, the
// row shows its details, and only the button inside opens another screen.
export function SetupChecklist({ checklist, onToggle, onDismiss, className }: Props) {
  const { tenant, hasFullApp } = useAccount();
  // null = follow the first unfinished step; set once the owner taps a row.
  const [openKey, setOpenKey] = useState<ChecklistStepKey | 'none' | null>(null);
  if (!tenant) return null;

  const steps = buildSteps(checklist, {
    // Branches are part of the full app only.
    showBranch: hasFullApp,
    showDriver: tenant.limits.max_drivers !== 0,
  });
  const required = steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => s.done).length;
  const expandedKey = openKey ?? steps.find((s) => !s.done)?.key;

  return (
    <View
      className={`rounded-3xl bg-white px-5 py-5 dark:bg-card-dark ${className ?? ''}`}
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-ink dark:text-white">Set up your shop</Text>
          <Text className="mt-0.5 text-xs text-muted">
            {doneCount} of {required.length} done · tap a circle to tick it
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} className="py-1 pl-3">
          <Text className="text-xs font-semibold text-muted">Hide</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-chip dark:bg-chip-dark">
        <View
          className="h-full rounded-full bg-primary dark:bg-primary-400"
          style={{ width: `${(doneCount / required.length) * 100}%` }}
        />
      </View>

      <View className="mt-2">
        {steps.map((step) => (
          <ChecklistRow
            key={step.key}
            step={step}
            expanded={step.key === expandedKey}
            onToggleExpanded={() => setOpenKey(step.key === expandedKey ? 'none' : step.key)}
            onToggleDone={() => onToggle(step.key, !step.done)}
          />
        ))}
      </View>
    </View>
  );
}

function ChecklistRow({
  step,
  expanded,
  onToggleExpanded,
  onToggleDone,
}: {
  step: Step;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleDone: () => void;
}) {
  return (
    <View className="flex-row gap-3 border-t border-divide py-3 dark:border-divide-dark">
      <TouchableOpacity
        onPress={onToggleDone}
        // Ticked by the shop's data, e.g. a staff account exists: nothing to untick.
        disabled={step.doneByData}
        hitSlop={10}
        activeOpacity={0.6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done, disabled: step.doneByData }}
        accessibilityLabel={step.title}
      >
        <IconSymbol
          name={step.done ? 'checkmark.circle.fill' : 'circle'}
          size={24}
          color={step.done ? '#10B981' : '#8A8FA8'}
        />
      </TouchableOpacity>

      <View className="flex-1">
        <TouchableOpacity onPress={onToggleExpanded} activeOpacity={0.7}>
          <Text
            className={`text-sm font-semibold ${step.done ? 'text-muted line-through' : 'text-ink dark:text-white'}`}
          >
            {step.title}
            {step.optional ? <Text className="font-normal text-muted"> (optional)</Text> : null}
          </Text>
        </TouchableOpacity>
        {expanded ? (
          <>
            <Text className="mt-1 text-xs text-subtle dark:text-subtle-dark">{step.description}</Text>
            <TouchableOpacity
              onPress={step.onAction}
              activeOpacity={0.85}
              className="mt-2.5 self-start rounded-lg bg-primary px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-white">{step.actionLabel}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

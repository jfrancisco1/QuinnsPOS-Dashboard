import { ActivityIndicator, Text, View } from 'react-native';

// Small floating "Updating…" note shown while saved data on screen is being
// refreshed. Place it last inside a full-screen `relative` container.
export function UpdatingPill({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" className="absolute bottom-4 left-0 right-0 items-center">
      <View
        className="flex-row items-center gap-2 rounded-full bg-ink px-4 py-2 dark:bg-chip-dark"
        style={{ shadowColor: '#1A1F3C', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
      >
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text className="text-xs font-semibold text-white">Updating…</Text>
      </View>
    </View>
  );
}

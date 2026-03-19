import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { setPendingDateRange } from '@/lib/date-range-store';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const start = from < to ? from : to;
  const end = from < to ? to : from;
  return d > start && d < end;
}

function formatShort(d: Date) {
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DateRangeScreen() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleDayPress(day: number) {
    const selected = new Date(viewYear, viewMonth, day);
    if (!from || (from && to)) {
      setFrom(selected);
      setTo(null);
    } else {
      if (selected < from) {
        setFrom(selected);
      } else if (isSameDay(selected, from)) {
        setFrom(null);
      } else {
        setTo(selected);
      }
    }
  }

  function handleApply() {
    if (!from || !to) return;
    const start = from < to ? from : to;
    const end = from < to ? to : from;
    setPendingDateRange(toISO(start), toISO(end));
    router.back();
  }

  // Build calendar cells
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const canApply = from !== null && to !== null;

  return (
    <View className="flex-1 bg-[#F5F6FA] dark:bg-[#12142A]">
      {/* Header */}
      <View className="bg-[#3B55D5] px-5 pb-5 pt-14 dark:bg-[#2A3BAF]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-2xl bg-white/20 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-base font-bold text-white">Custom Range</Text>

          <TouchableOpacity
            onPress={handleApply}
            disabled={!canApply}
            className={`rounded-2xl px-4 py-2 ${canApply ? 'bg-white' : 'bg-white/25'}`}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: canApply ? '#3B55D5' : 'rgba(255,255,255,0.45)' }}
            >
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Month navigation */}
        <View className="mb-5 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={prevMonth}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-[#1C1E38]"
            style={{ shadowColor: '#1A1F3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }}
          >
            <Text className="text-lg font-bold text-[#3B55D5]">‹</Text>
          </TouchableOpacity>

          <Text className="text-base font-bold text-[#1A1F3C] dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <TouchableOpacity
            onPress={nextMonth}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-[#1C1E38]"
            style={{ shadowColor: '#1A1F3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }}
          >
            <Text className="text-lg font-bold text-[#3B55D5]">›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View className="mb-3 flex-row">
          {DAY_LABELS.map(d => (
            <View key={d} className="flex-1 items-center">
              <Text className="text-xs font-semibold text-[#8A8FA8]">{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar weeks */}
        {weeks.map((week, wi) => (
          <View key={wi} className="mb-1 flex-row">
            {week.map((day, di) => {
              if (!day) return <View key={di} className="flex-1 py-1.5" />;

              const d = new Date(viewYear, viewMonth, day);
              const isFrom = from !== null && isSameDay(d, from);
              const isTo = to !== null && isSameDay(d, to);
              const inRange = isInRange(d, from, to);
              const isSelected = isFrom || isTo;

              return (
                <TouchableOpacity
                  key={di}
                  onPress={() => handleDayPress(day)}
                  className="flex-1 items-center py-1.5"
                  activeOpacity={0.7}
                >
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-full ${
                      isSelected
                        ? 'bg-[#3B55D5]'
                        : inRange
                          ? 'bg-[#DDEEFF] dark:bg-[#252845]'
                          : ''
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-[#1A1F3C] dark:text-white'
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Selection summary */}
        <View
          className="mt-6 rounded-3xl bg-white p-5 dark:bg-[#1C1E38]"
          style={{ shadowColor: '#1A1F3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3 }}
        >
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#8A8FA8]">From</Text>
              <Text className="mt-1.5 text-sm font-bold text-[#1A1F3C] dark:text-white">
                {from ? formatShort(from) : '—'}
              </Text>
            </View>
            <View className="w-px bg-[#E8EAF6] dark:bg-[#252845]" />
            <View className="flex-1 items-center">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#8A8FA8]">To</Text>
              <Text className="mt-1.5 text-sm font-bold text-[#1A1F3C] dark:text-white">
                {to ? formatShort(to) : '—'}
              </Text>
            </View>
          </View>
        </View>

        <Text className="mt-4 text-center text-xs text-[#8A8FA8]">
          Tap a start date, then tap an end date
        </Text>
      </ScrollView>
    </View>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { router, useFocusEffect } from "expo-router";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import {
  getExpenses,
  getSalesByItem,
  getSalesByPaymentType,
  getSalesSummary,
  type Expense,
  type SalesByItem,
  type SalesByPaymentType,
  type SalesSummary,
} from "@/lib/api";
import { takePendingDateRange } from "@/lib/date-range-store";

type Period = "today" | "this_week" | "this_month" | "this_year" | "custom";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "today", label: "Daily" },
  { key: "this_week", label: "Weekly" },
  { key: "this_month", label: "Monthly" },
  { key: "this_year", label: "Yearly" },
  { key: "custom", label: "Custom Range…" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function computeDateRange(
  period: Exclude<Period, "custom">,
  offset: number,
): { from: string; to: string } {
  const now = new Date();

  if (period === "today") {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return { from: toISO(d), to: toISO(d) };
  }

  if (period === "this_week") {
    const anchor = new Date(now);
    anchor.setDate(now.getDate() - now.getDay() + offset * 7);
    const to = new Date(anchor);
    to.setDate(anchor.getDate() + 6);
    return { from: toISO(anchor), to: toISO(to) };
  }

  if (period === "this_month") {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: toISO(d), to: toISO(last) };
  }

  const year = now.getFullYear() + offset;
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function getPeriodLabel(
  period: Period,
  offset: number,
  customFrom: string,
  customTo: string,
): string {
  if (period === "custom") {
    if (customFrom && customTo) {
      const fmt = (s: string) => {
        const d = new Date(s);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      };
      return `${fmt(customFrom)} – ${fmt(customTo)}`;
    }
    return "Custom";
  }

  const { from, to } = computeDateRange(period, offset);

  if (period === "today") {
    if (offset === 0) return "Today";
    if (offset === -1) return "Yesterday";
    return new Date(from).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (period === "this_week") {
    if (offset === 0) return "This Week";
    if (offset === -1) return "Last Week";
    const f = new Date(from).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const t = new Date(to).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${f} – ${t}`;
  }

  if (period === "this_month") {
    return new Date(from).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  return new Date(from).getFullYear().toString();
}

function isInDateRange(dateStr: string, from: string, to: string): boolean {
  const d = new Date(dateStr);
  const f = new Date(from);
  const t = new Date(to);
  t.setHours(23, 59, 59, 999);
  return d >= f && d <= t;
}

function fmtPeso(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const [chartContainerWidth, setChartContainerWidth] = useState(0);
  const { token } = useAuth();
  const { branches, selectedBranch, setSelectedBranch, loadBranches } =
    useBranch();

  const [period, setPeriod] = useState<Period>("today");
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesByItem, setSalesByItem] = useState<SalesByItem[]>([]);
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentType[]>([]);
  const [dailySummaries, setDailySummaries] = useState<
    { date: string; netSales: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  useEffect(() => {
    if (token) loadBranches(token);
  }, [token, loadBranches]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const pending = takePendingDateRange();
      let activePeriod: Period = period;
      let activeFrom = customFrom;
      let activeTo = customTo;
      let activeOffset = offset;

      if (pending) {
        activePeriod = "custom";
        activeFrom = pending.from;
        activeTo = pending.to;
        activeOffset = 0;
        setPeriod("custom");
        setCustomFrom(pending.from);
        setCustomTo(pending.to);
        setOffset(0);
      }

      setLoading(true);

      let fromStr: string;
      let toStr: string;
      if (activePeriod === "custom") {
        fromStr = activeFrom;
        toStr = activeTo;
      } else {
        const range = computeDateRange(activePeriod, activeOffset);
        fromStr = range.from;
        toStr = range.to;
      }

      // Build slice keys for weekly/monthly (per-day), yearly (per-month), and custom ranges
      const today = toISO(new Date());
      type SliceKey = { from: string; to: string; label: string };
      const sliceKeys: SliceKey[] = [];
      const MONTHS_SHORT = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      if (activePeriod === "this_week") {
        const start = parseLocalISO(fromStr);
        for (let i = 0; i < 7; i++) {
          const d = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + i,
          );
          const iso = toISO(d);
          sliceKeys.push({
            from: iso,
            to: iso,
            label: String(d.getDate()),
          });
        }
      } else if (activePeriod === "this_month") {
        const start = parseLocalISO(fromStr);
        const end = parseLocalISO(toStr);
        for (let i = 0; ; i++) {
          const d = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + i,
          );
          if (d > end) break;
          const iso = toISO(d);
          if (iso > today) break;
          sliceKeys.push({
            from: iso,
            to: iso,
            label: String(d.getDate()),
          });
        }
      } else if (activePeriod === "this_year") {
        const year = parseLocalISO(fromStr).getFullYear();
        for (let m = 0; m < 12; m++) {
          const first = `${year}-${String(m + 1).padStart(2, "0")}-01`;
          const lastDay = new Date(year, m + 1, 0);
          sliceKeys.push({
            from: first,
            to: toISO(lastDay),
            label: MONTHS_SHORT[m],
          });
        }
      } else if (activePeriod === "custom" && activeFrom && activeTo) {
        const cfrom = parseLocalISO(activeFrom);
        const cto = parseLocalISO(activeTo);
        if (cfrom.getFullYear() !== cto.getFullYear()) {
          // Year granularity
          for (let y = cfrom.getFullYear(); y <= cto.getFullYear(); y++) {
            sliceKeys.push({
              from: `${y}-01-01`,
              to: `${y}-12-31`,
              label: String(y),
            });
          }
        } else if (cfrom.getMonth() !== cto.getMonth()) {
          // Month granularity
          for (let m = cfrom.getMonth(); m <= cto.getMonth(); m++) {
            const first = `${cfrom.getFullYear()}-${String(m + 1).padStart(2, "0")}-01`;
            const last = toISO(new Date(cfrom.getFullYear(), m + 1, 0));
            sliceKeys.push({ from: first, to: last, label: MONTHS_SHORT[m] });
          }
        } else {
          // Day granularity (same month)
          for (let i = 0; ; i++) {
            const d = new Date(
              cfrom.getFullYear(),
              cfrom.getMonth(),
              cfrom.getDate() + i,
            );
            if (d > cto) break;
            sliceKeys.push({
              from: toISO(d),
              to: toISO(d),
              label: String(d.getDate()),
            });
          }
        }
      }

      const baseRequests = Promise.all([
        getSalesSummary(token, "custom", {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
        }),
        getExpenses(token),
        getSalesByItem(token, activePeriod, {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
        }),
        getSalesByPaymentType(token, activePeriod, {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
        }),
      ]);

      const sliceRequests =
        sliceKeys.length > 0
          ? Promise.all(
              sliceKeys.map((s) =>
                getSalesSummary(token, "custom", {
                  from: s.from,
                  to: s.to,
                  branch_id: selectedBranch?.id,
                }),
              ),
            )
          : Promise.resolve(
              [] as Awaited<ReturnType<typeof getSalesSummary>>[],
            );

      Promise.all([baseRequests, sliceRequests]).then(
        ([[sumRes, expRes, itemsRes, paymentRes], sliceResults]) => {
          if (sumRes.ok) setSummary(sumRes.data);
          if (expRes.ok) setExpenses(expRes.data);
          if (itemsRes.ok) setSalesByItem(itemsRes.data);
          if (paymentRes.ok) setSalesByPayment(paymentRes.data);
          if (sliceKeys.length > 0) {
            setDailySummaries(
              sliceKeys.map((s, i) => ({
                date: s.label,
                netSales: sliceResults[i]?.ok
                  ? sliceResults[i].data.netSales
                  : 0,
              })),
            );
          } else {
            setDailySummaries([]);
          }
          setLoading(false);
        },
      );
    }, [token, period, offset, customFrom, customTo, selectedBranch]),
  );

  function handlePeriodSelect(key: Period) {
    setPeriodModalVisible(false);
    if (key === "custom") {
      router.push("/date-range");
    } else {
      setPeriod(key);
      setOffset(0);
      setCustomFrom("");
      setCustomTo("");
    }
  }

  let expenseFrom = customFrom;
  let expenseTo = customTo;
  if (period !== "custom") {
    const range = computeDateRange(period, offset);
    expenseFrom = range.from;
    expenseTo = range.to;
  }

  const totalExpenses = expenses
    .filter((e) => isInDateRange(e.expense_date, expenseFrom, expenseTo))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const grossProfit = summary?.grossProfit ?? 0;
  const netProfit = grossProfit - totalExpenses;
  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);

  const canGoForward = period !== "custom" && offset < 0;
  const canGoBack = period !== "custom";

  const isSingleDay =
    period === "today" ||
    (period === "custom" && customFrom !== "" && customFrom === customTo);

  const isTimeSeries =
    period === "this_week" ||
    period === "this_month" ||
    period === "this_year" ||
    (period === "custom" && dailySummaries.length > 0);

  // Determine custom range granularity from the selected dates.
  const customGranularity: "day" | "month" | "year" = (() => {
    if (period !== "custom" || !customFrom || !customTo) return "day";
    const f = parseLocalISO(customFrom);
    const t = parseLocalISO(customTo);
    if (f.getFullYear() !== t.getFullYear()) return "year";
    if (f.getMonth() !== t.getMonth()) return "month";
    return "day";
  })();

  // Bar area = measured container width minus the explicit yAxisLabelWidth.
  const Y_AXIS_WIDTH = 38;
  const barArea = Math.max(chartContainerWidth - Y_AXIS_WIDTH, 0);
  const weeklySpacing = 6;
  const weeklyBarWidth = Math.max(
    1,
    Math.floor((barArea - weeklySpacing * 6) / 7),
  );
  const yearlySpacing = 4;
  const yearlyBarWidth = Math.max(
    1,
    Math.floor((barArea - yearlySpacing * 11) / 12),
  );
  const monthlySpacing = 2;
  const monthlyNumBars =
    period === "this_month" && dailySummaries.length > 0
      ? dailySummaries.length
      : 31;
  const monthlyBarWidth = Math.max(
    1,
    Math.floor(
      (barArea - monthlySpacing * (monthlyNumBars - 1)) / monthlyNumBars,
    ),
  );

  // Custom range bar sizing depends on granularity and actual bar count.
  const customNumBars = Math.max(dailySummaries.length, 1);
  const customSpacing = customGranularity === "day" ? 2 : 6;
  const customBarWidth = Math.max(
    1,
    Math.floor((barArea - customSpacing * (customNumBars - 1)) / customNumBars),
  );

  // Dynamic label interval for day-granularity views (monthly and custom-day).
  // A 2-digit label at fontSize 9 is ~14px wide; each bar slot is (barWidth + spacing) px.
  const LABEL_WIDTH = 14;
  const monthlyInterval =
    monthlyBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (monthlyBarWidth + monthlySpacing)))
      : 5;
  const customDayInterval =
    customBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (customBarWidth + customSpacing)))
      : 5;

  // Time-series chart: one bar per slice, X = label from dailySummaries, Y = net sales
  const timeSeriesChartData = dailySummaries.map(
    ({ date: label, netSales }, i) => ({
      value: netSales,
      label:
        period === "this_month"
          ? i % monthlyInterval === 0
            ? label
            : ""
          : period === "custom" && customGranularity === "day"
            ? i % customDayInterval === 0
              ? label
              : ""
            : label,
      frontColor: "#3B55D5",
    }),
  );

  // Default chart data (non-time-series)
  const chartData = [
    { value: summary?.grossSales ?? 0, label: "Gross", frontColor: "#3B55D5" },
    {
      value: summary?.netSales ?? 0,
      label: "Net Sales",
      frontColor: "#6C7FE8",
    },
    { value: summary?.costOfGoods ?? 0, label: "COGS", frontColor: "#F59E0B" },
    { value: grossProfit, label: "Gross\nProfit", frontColor: "#22C55E" },
    { value: totalExpenses, label: "Expenses", frontColor: "#EF4444" },
    {
      value: Math.max(netProfit, 0),
      label: "Net\nProfit",
      frontColor: netProfit >= 0 ? "#0EA5E9" : "#EF4444",
    },
  ];

  // Legend items
  const legendItems = [
    { label: "Gross Sales", value: summary?.grossSales ?? 0, color: "#3B55D5" },
    { label: "Discounts", value: -(summary?.discounts ?? 0), color: "#8A8FA8" },
    { label: "Net Sales", value: summary?.netSales ?? 0, color: "#6C7FE8" },
    {
      label: "Cost of Goods",
      value: summary?.costOfGoods ?? 0,
      color: "#F59E0B",
    },
    { label: "Gross Profit", value: grossProfit, color: "#22C55E" },
    { label: "Expenses", value: -totalExpenses, color: "#EF4444" },
    {
      label: "Net Profit",
      value: netProfit,
      color: netProfit >= 0 ? "#0EA5E9" : "#EF4444",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-[#F5F6FA] dark:bg-[#12142A]">
      {/* Header */}
      <View className="bg-[#3B55D5] px-5 pb-5 pt-14 dark:bg-[#2A3BAF]">
        <View className="flex-row items-center">
          <View className="w-10" />
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-white">Sales</Text>
            {selectedBranch ? (
              <Text className="mt-0.5 text-xs font-semibold text-[#DDEEFF]">
                {selectedBranch.name}
              </Text>
            ) : (
              <Text className="mt-0.5 text-xs text-[#BFCEFF]">
                All Branches
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date navigator */}
        <View className="mt-4 flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => setOffset((o) => o - 1)}
            disabled={!canGoBack}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoBack ? "opacity-30" : ""}`}
          >
            <Text className="text-2xl font-bold text-white">‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodModalVisible(true)}
            activeOpacity={0.8}
            className="mx-3 flex-1 items-center rounded-full bg-white/20 py-1.5"
          >
            <Text
              className="text-sm font-semibold text-white"
              numberOfLines={1}
            >
              {periodLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOffset((o) => o + 1)}
            disabled={!canGoForward}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoForward ? "opacity-30" : ""}`}
          >
            <Text className="text-2xl font-bold text-white">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Branch picker modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setBranchModalVisible(false)}
        >
          <View
            className="mx-4 mt-28 rounded-3xl bg-white p-5 dark:bg-[#1C1E38]"
            style={{
              shadowColor: "#1A1F3C",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-[#1A1F3C] dark:text-white">
              Select Branch
            </Text>
            {branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                onPress={() => {
                  setSelectedBranch(branch);
                  setBranchModalVisible(false);
                }}
                className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                  selectedBranch?.id === branch.id
                    ? "bg-[#3B55D5]"
                    : "bg-[#ECEEFF] dark:bg-[#252845]"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedBranch?.id === branch.id
                      ? "text-white"
                      : "text-[#1A1F3C] dark:text-[#C8CCF0]"
                  }`}
                >
                  {branch.name}
                </Text>
                {selectedBranch?.id === branch.id && (
                  <View className="h-2 w-2 rounded-full bg-white/80" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Period type picker modal */}
      <Modal
        visible={periodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setPeriodModalVisible(false)}
        >
          <View
            className="mx-4 mt-40 rounded-3xl bg-white p-5 dark:bg-[#1C1E38]"
            style={{
              shadowColor: "#1A1F3C",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-[#1A1F3C] dark:text-white">
              View By
            </Text>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = period === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handlePeriodSelect(opt.key)}
                  className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                    isActive ? "bg-[#3B55D5]" : "bg-[#ECEEFF] dark:bg-[#252845]"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isActive
                        ? "text-white"
                        : "text-[#1A1F3C] dark:text-[#C8CCF0]"
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {opt.key === "custom" ? (
                    <IconSymbol
                      name="chevron.right"
                      size={14}
                      color={isActive ? "#fff" : "#8A8FA8"}
                    />
                  ) : isActive ? (
                    <View className="h-2 w-2 rounded-full bg-white/80" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View className="items-center py-20">
          <Text className="text-sm text-[#8A8FA8]">Loading...</Text>
        </View>
      ) : (
        <View className="gap-4 px-5 pb-10 pt-4">
          {/* Bar Chart Card — hidden for single-day views */}
          {!isSingleDay && (
            <View
              className="rounded-3xl bg-white px-4 pb-6 pt-5 dark:bg-[#1C1E38]"
              style={{
                shadowColor: "#1A1F3C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-[#8A8FA8]">
                Sales Overview
              </Text>

              <View
                onLayout={(e) =>
                  setChartContainerWidth(e.nativeEvent.layout.width)
                }
              >
                {isTimeSeries ? (
                  <BarChart
                    data={timeSeriesChartData}
                    barWidth={
                      period === "this_year"
                        ? yearlyBarWidth
                        : period === "this_month"
                          ? monthlyBarWidth
                          : period === "custom"
                            ? customBarWidth
                            : weeklyBarWidth
                    }
                    spacing={
                      period === "this_year"
                        ? yearlySpacing
                        : period === "this_month"
                          ? monthlySpacing
                          : period === "custom"
                            ? customSpacing
                            : weeklySpacing
                    }
                    width={barArea}
                    yAxisLabelWidth={Y_AXIS_WIDTH}
                    initialSpacing={0}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: "#8A8FA8", fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: "#5A5E7A",
                      fontSize: 9,
                      textAlign: "center",
                    }}
                    noOfSections={4}
                    maxValue={
                      Math.max(...timeSeriesChartData.map((d) => d.value), 1) *
                      1.2
                    }
                    isAnimated
                    animationDuration={600}
                    barBorderRadius={6}
                    formatYLabel={(v) => {
                      const n = Number(v);
                      if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
                      if (n >= 1000) return `₱${(n / 1000).toFixed(0)}k`;
                      return `₱${n}`;
                    }}
                  />
                ) : (
                  <BarChart
                    data={chartData}
                    barWidth={38}
                    spacing={12}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: "#8A8FA8", fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: "#5A5E7A",
                      fontSize: 9,
                      textAlign: "center",
                    }}
                    noOfSections={4}
                    maxValue={
                      Math.max(...chartData.map((d) => d.value), 1) * 1.2
                    }
                    isAnimated
                    animationDuration={600}
                    barBorderRadius={6}
                    formatYLabel={(v) => {
                      const n = Number(v);
                      if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
                      if (n >= 1000) return `₱${(n / 1000).toFixed(0)}k`;
                      return `₱${n}`;
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Items Card */}
          {salesByItem.length > 0 && (
            <View
              className="rounded-3xl bg-white px-5 py-5 dark:bg-[#1C1E38]"
              style={{
                shadowColor: "#1A1F3C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8A8FA8]">
                Sales by Items
              </Text>

              {salesByItem.map((row, i) => (
                <View key={row.item_id}>
                  <View className="flex-row items-center justify-between py-2.5">
                    <View className="flex-1 pr-4">
                      <Text className="text-sm font-semibold text-[#1A1F3C] dark:text-white">
                        {row.label}
                      </Text>
                      <Text className="mt-0.5 text-xs text-[#8A8FA8]">
                        {row.category} · ×{row.qty.toLocaleString("en-PH")}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-[#3B55D5]">
                      {fmtPeso(row.net_sales)}
                    </Text>
                  </View>
                  {i < salesByItem.length - 1 && (
                    <View className="h-px bg-[#F0F2FF] dark:bg-[#1E2040]" />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Payment Type Card */}
          {salesByPayment.length > 0 && (
            <View
              className="rounded-3xl bg-white px-5 py-5 dark:bg-[#1C1E38]"
              style={{
                shadowColor: "#1A1F3C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8A8FA8]">
                Payment Types
              </Text>

              {salesByPayment.map((row, i) => (
                <View key={row.payment_method}>
                  <View className="flex-row items-center justify-between py-2.5">
                    <View className="flex-1 pr-4">
                      <Text className="text-sm font-semibold capitalize text-[#1A1F3C] dark:text-white">
                        {row.payment_method}
                      </Text>
                      <Text className="mt-0.5 text-xs text-[#8A8FA8]">
                        {row.transactions} transaction{row.transactions !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-[#3B55D5]">
                      {fmtPeso(row.net_amount)}
                    </Text>
                  </View>
                  {i < salesByPayment.length - 1 && (
                    <View className="h-px bg-[#F0F2FF] dark:bg-[#1E2040]" />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Legend / Breakdown Card */}
          <View
            className="rounded-3xl bg-white px-5 py-5 dark:bg-[#1C1E38]"
            style={{
              shadowColor: "#1A1F3C",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.07,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8A8FA8]">
              Breakdown
            </Text>

            {legendItems.map((item, i) => (
              <View key={item.label}>
                <View className="flex-row items-center justify-between py-2.5">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-sm text-[#5A5E7A] dark:text-[#8A8FA8]">
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: item.color }}
                  >
                    {item.value < 0
                      ? `-${fmtPeso(Math.abs(item.value))}`
                      : fmtPeso(item.value)}
                  </Text>
                </View>
                {i < legendItems.length - 1 && (
                  <View className="h-px bg-[#F0F2FF] dark:bg-[#1E2040]" />
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

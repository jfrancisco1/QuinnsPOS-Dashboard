import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { router, useFocusEffect } from "expo-router";

import { BranchPickerModal } from "@/components/ui/branch-picker-modal";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ItemShapeSwatch } from "@/components/items/item-shape-swatch";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import {
  getExpenses,
  getItems,
  getSalesByItem,
  getSalesByPaymentType,
  getSalesSummary,
  type Expense,
  type Item,
  type SalesByItem,
  type SalesByPaymentType,
  type SalesSummary,
} from "@/lib/api";
import {
  computeDateRange,
  getPeriodLabel,
  isInDateRange,
  parseLocalISO,
  toISO,
  type Period,
} from "@/lib/date-helpers";
import { takePendingDateRange } from "@/lib/date-range-store";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "today", label: "Daily" },
  { key: "this_week", label: "Weekly" },
  { key: "this_month", label: "Monthly" },
  { key: "this_year", label: "Yearly" },
  { key: "custom", label: "Custom Range…" },
];

type McIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function getPaymentIcon(method: string): { icon: McIcon; color: string } {
  const key = method.replace(/^paid_/i, "").toLowerCase();
  if (key === "cash") return { icon: "cash", color: "#22C55E" };
  if (key === "gcash") return { icon: "cellphone", color: "#0070FF" };
  return { icon: "credit-card-outline", color: "#8A8FA8" };
}

function fmtPeso(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesScreen() {
  const [chartContainerWidth, setChartContainerWidth] = useState(0);
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();

  const [period, setPeriod] = useState<Period>("today");
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesByItem, setSalesByItem] = useState<SalesByItem[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<number, Item>>(new Map());
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentType[]>(
    [],
  );
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
          sliceKeys.push({ from: iso, to: iso, label: String(d.getDate()) });
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
          sliceKeys.push({ from: iso, to: iso, label: String(d.getDate()) });
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
          for (let y = cfrom.getFullYear(); y <= cto.getFullYear(); y++) {
            sliceKeys.push({
              from: `${y}-01-01`,
              to: `${y}-12-31`,
              label: String(y),
            });
          }
        } else if (cfrom.getMonth() !== cto.getMonth()) {
          for (let m = cfrom.getMonth(); m <= cto.getMonth(); m++) {
            const first = `${cfrom.getFullYear()}-${String(m + 1).padStart(2, "0")}-01`;
            const last = toISO(new Date(cfrom.getFullYear(), m + 1, 0));
            sliceKeys.push({ from: first, to: last, label: MONTHS_SHORT[m] });
          }
        } else {
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
        getSalesByItem(token, "custom", {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
        }),
        getSalesByPaymentType(token, "custom", {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
        }),
        getItems(token),
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
        ([[sumRes, expRes, itemsRes, paymentRes, allItemsRes], sliceResults]) => {
          if (sumRes.ok) setSummary(sumRes.data);
          if (expRes.ok) setExpenses(expRes.data);
          if (itemsRes.ok) setSalesByItem(itemsRes.data);
          if (paymentRes.ok) setSalesByPayment(paymentRes.data);
          if (allItemsRes.ok) {
            setItemsMap(new Map(allItemsRes.data.map((it) => [it.id, it])));
          }
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

  const customGranularity: "day" | "month" | "year" = (() => {
    if (period !== "custom" || !customFrom || !customTo) return "day";
    const f = parseLocalISO(customFrom);
    const t = parseLocalISO(customTo);
    if (f.getFullYear() !== t.getFullYear()) return "year";
    if (f.getMonth() !== t.getMonth()) return "month";
    return "day";
  })();

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

  const customNumBars = Math.max(dailySummaries.length, 1);
  const customSpacing = customGranularity === "day" ? 2 : 6;
  const customBarWidth = Math.max(
    1,
    Math.floor((barArea - customSpacing * (customNumBars - 1)) / customNumBars),
  );

  const LABEL_WIDTH = 14;
  const monthlyInterval =
    monthlyBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (monthlyBarWidth + monthlySpacing)))
      : 5;
  const customDayInterval =
    customBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (customBarWidth + customSpacing)))
      : 5;

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
      frontColor: "#CCFFCC",
    }),
  );

  const chartData = [
    { value: summary?.grossSales ?? 0, label: "Gross", frontColor: "#560591" },
    {
      value: summary?.netSales ?? 0,
      label: "Net Sales",
      frontColor: "#9130F0",
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

  const legendItems = [
    {
      label: "Gross Sales",
      value: summary?.grossSales ?? 0,
      color: "#560591",
      bold: false,
    },
    {
      label: "Discounts",
      value: -(summary?.discounts ?? 0),
      color: "#8A8FA8",
      bold: false,
    },
    {
      label: "Net Sales",
      value: summary?.netSales ?? 0,
      color: "#9130F0",
      bold: true,
    },
    {
      label: "Cost of Goods",
      value: summary?.costOfGoods ?? 0,
      color: "#F59E0B",
      bold: false,
    },
    { label: "Gross Profit", value: grossProfit, color: "#22C55E", bold: true },
    { label: "Expenses", value: -totalExpenses, color: "#EF4444", bold: false },
    {
      label: "Net Profit",
      value: netProfit,
      color: netProfit >= 0 ? "#0EA5E9" : "#EF4444",
      bold: true,
    },
  ];

  const chartAxisStyle = { color: "#8A8FA8", fontSize: 10 };
  const chartXLabelStyle = {
    color: "#5A5E7A",
    fontSize: 9,
    textAlign: "center" as const,
  };
  const formatYLabel = (v: string) => {
    const n = Number(v);
    if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `₱${(n / 1000).toFixed(0)}k`;
    return `₱${n}`;
  };

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      {/* Header */}
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        {/* Title row */}
        <View className="flex-row items-center">
          {/* Centered text — absolutely positioned */}
          <View className="absolute left-0 right-0 items-center">
            <Text className="text-xl font-bold text-white">Sales</Text>
            {selectedBranch ? (
              <Text
                className="text-xs font-semibold text-primary-100"
                numberOfLines={1}
              >
                {selectedBranch.name}
              </Text>
            ) : (
              <Text className="text-xs text-primary-200">All Branches</Text>
            )}
          </View>

          {/* Spacer to push button to the right */}
          <View className="flex-1" />

          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date navigator */}
        <View className="mt-3 flex-row items-center">
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
            className="mx-2 flex-1 items-center rounded-full bg-white/20 py-1.5"
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

      <BranchPickerModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
      />

      {/* Period picker modal */}
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
            className="mx-4 mt-40 rounded-3xl bg-white p-5 dark:bg-card-dark"
            style={{
              shadowColor: "#1A1F3C",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-ink dark:text-white">
              View By
            </Text>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = period === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handlePeriodSelect(opt.key)}
                  className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                    isActive ? "bg-primary" : "bg-chip dark:bg-chip-dark"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isActive ? "text-white" : "text-ink dark:text-subtle-dark"
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
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <View className="gap-4 px-5 pb-10 pt-4">
          {!isSingleDay && (
            <Card title="Sales Overview">
              <View
                onLayout={(e) =>
                  setChartContainerWidth(e.nativeEvent.layout.width)
                }
              >
                {chartContainerWidth === 0 ? null : isTimeSeries ? (
                  <BarChart
                    key={`ts-${chartContainerWidth}-${period}-${offset}-${timeSeriesChartData.length}`}
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
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={chartAxisStyle}
                    xAxisLabelTextStyle={chartXLabelStyle}
                    noOfSections={4}
                    maxValue={
                      Math.max(...timeSeriesChartData.map((d) => d.value), 1) *
                      1.2
                    }
                    barBorderRadius={0}
                    formatYLabel={formatYLabel}
                  />
                ) : (
                  <BarChart
                    key={`summary-${chartContainerWidth}-${period}-${offset}`}
                    data={chartData}
                    barWidth={38}
                    spacing={12}
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={chartAxisStyle}
                    xAxisLabelTextStyle={chartXLabelStyle}
                    noOfSections={4}
                    maxValue={
                      Math.max(...chartData.map((d) => d.value), 1) * 1.2
                    }
                    barBorderRadius={0}
                    formatYLabel={formatYLabel}
                  />
                )}
              </View>
            </Card>
          )}

          <Card title="Breakdown">
            {legendItems.map((item, i) => (
              <View key={item.label}>
                <View
                  className={`flex-row items-center justify-between py-2.5 ${item.bold ? "bg-chip dark:bg-chip-dark -mx-4 px-4 rounded-xl" : ""}`}
                >
                  <Text
                    className={`text-sm ${item.bold ? "font-bold text-ink dark:text-white" : "text-subtle dark:text-muted"}`}
                  >
                    {item.label}
                  </Text>
                  <Text
                    className={`text-sm font-bold`}
                    style={{ color: item.color }}
                  >
                    {item.value < 0
                      ? `-${fmtPeso(Math.abs(item.value))}`
                      : fmtPeso(Math.abs(item.value))}
                  </Text>
                </View>
                {i < legendItems.length - 1 && (
                  <View className="h-px bg-divide dark:bg-divide-dark" />
                )}
              </View>
            ))}
          </Card>

          {salesByItem.length > 0 && (
            <Card title="Sales by Items">
              {salesByItem.map((row, i) => {
                const item = itemsMap.get(Number(row.item_id));
                const color = row.color ?? item?.color ?? null;
                const shape = row.shape ?? item?.shape ?? null;
                return (
                <View key={row.item_id}>
                  <View className="flex-row items-center justify-between py-2.5">
                    <View className="flex-row items-center gap-3 flex-1 pr-4">
                      {color && shape && (
                        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: color + "1A" }}>
                          <ItemShapeSwatch color={color} shape={shape} />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-ink dark:text-white">
                          {row.label}
                        </Text>
                        <Text className="mt-0.5 text-xs text-muted">
                          {row.category} · ×{row.qty.toLocaleString("en-PH")}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-primary">
                      {fmtPeso(row.net_sales)}
                    </Text>
                  </View>
                  {i < salesByItem.length - 1 && (
                    <View className="h-px bg-divide dark:bg-divide-dark" />
                  )}
                </View>
                );
              })}
            </Card>
          )}

          {salesByPayment.length > 0 && (
            <Card title="Payment Types">
              {salesByPayment.map((row, i) => {
                const { icon, color } = getPaymentIcon(row.payment_method);
                return (
                  <View key={row.payment_method}>
                    <View className="flex-row items-center justify-between py-2.5">
                      <View className="flex-row items-center gap-3 flex-1 pr-4">
                        <View
                          className="h-9 w-9 items-center justify-center rounded-xl"
                          style={{ backgroundColor: color + "1A" }}
                        >
                          <MaterialCommunityIcons
                            name={icon}
                            size={20}
                            color={color}
                          />
                        </View>
                        <View>
                          <Text className="text-sm font-semibold capitalize text-ink dark:text-white">
                            {row.payment_method.replace(/^paid_/i, "")}
                          </Text>
                          <Text className="mt-0.5 text-xs text-muted">
                            {row.transactions} transaction
                            {row.transactions !== 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-primary">
                        {fmtPeso(row.net_amount)}
                      </Text>
                    </View>
                    {i < salesByPayment.length - 1 && (
                      <View className="h-px bg-divide dark:bg-divide-dark" />
                    )}
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

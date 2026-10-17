import { MaterialCommunityIcons } from "@expo/vector-icons";

type McIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Payment methods arrive as either "cash" (reports) or "paid_cash" (order
// paymentStatus); normalize so the two can be compared.
export function paymentMethodKey(method: string): string {
  return method.replace(/^paid_/i, "").toLowerCase();
}

export function getPaymentIcon(method: string): {
  icon: McIcon;
  color: string;
} {
  const key = paymentMethodKey(method);
  if (key === "cash") return { icon: "cash", color: "#22C55E" };
  if (key === "gcash") return { icon: "cellphone", color: "#0070FF" };
  if (key === "unpaid") return { icon: "cash", color: "#FF0000" };
  return { icon: "credit-card-outline", color: "#8A8FA8" };
}

export function fmtPeso(n: number | undefined | null): string {
  const [integer, decimal] = (n ?? 0).toFixed(2).split(".");
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₱${withCommas}.${decimal}`;
}

export function isAddOnCategory(categoryName: string | undefined | null): boolean {
  // Matches "Ad Ons", "Add-ons", "Addons", "Add Ons", etc.
  return /ad{1,2}[\s-]?ons?\b/i.test(categoryName ?? "");
}

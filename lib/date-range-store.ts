/** Simple module-level store for passing a custom date range from the picker back to the reports screen. */

let pendingRange: { from: string; to: string } | null = null;

export function setPendingDateRange(from: string, to: string) {
  pendingRange = { from, to };
}

export function takePendingDateRange(): { from: string; to: string } | null {
  const v = pendingRange;
  pendingRange = null;
  return v;
}

export type Period = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
export function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function computeDateRange(
  period: Exclude<Period, 'custom'>,
  offset: number,
): { from: string; to: string } {
  const now = new Date();

  if (period === 'today') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return { from: toISO(d), to: toISO(d) };
  }

  if (period === 'this_week') {
    const anchor = new Date(now);
    anchor.setDate(now.getDate() - now.getDay() + offset * 7);
    const to = new Date(anchor);
    to.setDate(anchor.getDate() + 6);
    return { from: toISO(anchor), to: toISO(to) };
  }

  if (period === 'this_month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: toISO(d), to: toISO(last) };
  }

  const year = now.getFullYear() + offset;
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function getPeriodLabel(
  period: Period,
  offset: number,
  customFrom: string,
  customTo: string,
): string {
  const PH = 'Asia/Manila';

  if (period === 'custom') {
    if (customFrom && customTo) {
      const fmt = (s: string) =>
        parseLocalISO(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: PH });
      return `${fmt(customFrom)} – ${fmt(customTo)}`;
    }
    return 'Custom';
  }

  const { from, to } = computeDateRange(period, offset);

  if (period === 'today') {
    if (offset === 0) return 'Today';
    if (offset === -1) return 'Yesterday';
    return parseLocalISO(from).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: PH,
    });
  }

  if (period === 'this_week') {
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    const f = parseLocalISO(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: PH });
    const t = parseLocalISO(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: PH });
    return `${f} – ${t}`;
  }

  if (period === 'this_month') {
    return parseLocalISO(from).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: PH });
  }

  return new Date(from).getFullYear().toString();
}

export function isInDateRange(dateStr: string, from: string, to: string): boolean {
  const d = new Date(dateStr);
  const f = new Date(from);
  const t = new Date(to);
  t.setHours(23, 59, 59, 999);
  return d >= f && d <= t;
}

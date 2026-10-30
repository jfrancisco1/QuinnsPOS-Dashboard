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

const COMPARE_UNIT: Record<Exclude<Period, 'custom'>, [current: string, past: string]> = {
  today: ['this time yesterday', 'the day before'],
  this_week: ['this point last week', 'the week before'],
  this_month: ['this point last month', 'the month before'],
  this_year: ['this point last year', 'the year before'],
};

/**
 * The range to compare a period's net sales against, and how to label it. The current
 * (in-progress) period is compared like-for-like: the previous period is cut off as far
 * into it as now is into the current one, so a half-finished week isn't measured
 * against a whole one. `to` then carries a local time ("YYYY-MM-DD HH:MM:SS").
 */
export function computeCompareRange(
  period: Period,
  offset: number,
  customFrom: string,
  customTo: string,
): { from: string; to: string; label: string } | null {
  if (period === 'custom') {
    if (!customFrom || !customTo) return null;
    const from = parseLocalISO(customFrom);
    const days = Math.round((parseLocalISO(customTo).getTime() - from.getTime()) / 86_400_000) + 1;
    const prevTo = new Date(from);
    prevTo.setDate(from.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevTo.getDate() - (days - 1));
    return { from: toISO(prevFrom), to: toISO(prevTo), label: `the ${days} day${days !== 1 ? 's' : ''} before` };
  }

  const [currentLabel, pastLabel] = COMPARE_UNIT[period];
  const previous = computeDateRange(period, offset - 1);
  if (offset !== 0) return { ...previous, label: pastLabel };

  const elapsed = Date.now() - parseLocalISO(computeDateRange(period, 0).from).getTime();
  const cutoff = new Date(parseLocalISO(previous.from).getTime() + elapsed);
  const previousEnd = parseLocalISO(previous.to);
  previousEnd.setHours(23, 59, 59);
  const end = cutoff < previousEnd ? cutoff : previousEnd;
  const time = [end.getHours(), end.getMinutes(), end.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  return { from: previous.from, to: `${toISO(end)} ${time}`, label: currentLabel };
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

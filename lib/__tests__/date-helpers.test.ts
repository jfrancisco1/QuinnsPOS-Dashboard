import {
  computeCompareRange,
  computeDateRange,
  getPeriodLabel,
  isInDateRange,
  parseLocalISO,
  toISO,
} from '@/lib/date-helpers';

// Wednesday, 2026-11-04 10:30 local time.
const NOW = new Date(2026, 10, 4, 10, 30, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('toISO / parseLocalISO', () => {
  it('formats a local date as YYYY-MM-DD with padding', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('parses to local midnight and round-trips', () => {
    const d = parseLocalISO('2026-03-09');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 9, 0]);
    expect(toISO(d)).toBe('2026-03-09');
  });
});

describe('computeDateRange', () => {
  it('handles today and yesterday', () => {
    expect(computeDateRange('today', 0)).toEqual({ from: '2026-11-04', to: '2026-11-04' });
    expect(computeDateRange('today', -1)).toEqual({ from: '2026-11-03', to: '2026-11-03' });
  });

  it('runs weeks Sunday to Saturday', () => {
    expect(computeDateRange('this_week', 0)).toEqual({ from: '2026-11-01', to: '2026-11-07' });
    expect(computeDateRange('this_week', -1)).toEqual({ from: '2026-10-25', to: '2026-10-31' });
  });

  it('covers whole months, across year boundaries', () => {
    expect(computeDateRange('this_month', 0)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(computeDateRange('this_month', 2)).toEqual({ from: '2027-01-01', to: '2027-01-31' });
    expect(computeDateRange('this_month', -9)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('covers whole years', () => {
    expect(computeDateRange('this_year', -1)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
  });
});

describe('computeCompareRange', () => {
  it('compares a custom range with the same number of days before it', () => {
    expect(computeCompareRange('custom', 0, '2026-10-10', '2026-10-16')).toEqual({
      from: '2026-10-03',
      to: '2026-10-09',
      label: 'the 7 days before',
    });
    expect(computeCompareRange('custom', 0, '2026-10-10', '2026-10-10')?.label).toBe('the 1 day before');
  });

  it('returns null for an incomplete custom range', () => {
    expect(computeCompareRange('custom', 0, '2026-10-10', '')).toBeNull();
  });

  it('compares a past period with the whole period before it', () => {
    expect(computeCompareRange('this_month', -1, '', '')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      label: 'the month before',
    });
  });

  it('cuts the previous period off at the same point as now', () => {
    expect(computeCompareRange('today', 0, '', '')).toEqual({
      from: '2026-11-03',
      to: '2026-11-03 10:30:00',
      label: 'this time yesterday',
    });
    // Wednesday 10:30 of this week -> Wednesday 10:30 of last week.
    expect(computeCompareRange('this_week', 0, '', '')).toEqual({
      from: '2026-10-25',
      to: '2026-10-28 10:30:00',
      label: 'this point last week',
    });
  });

  it('caps the cutoff at the end of a shorter previous period', () => {
    // March 31 vs February (28 days): stop at Feb 28 23:59:59.
    jest.setSystemTime(new Date(2026, 2, 31, 12, 0, 0));
    expect(computeCompareRange('this_month', 0, '', '')?.to).toBe('2026-02-28 23:59:59');
  });
});

describe('getPeriodLabel', () => {
  it('uses relative names for the current and previous day/week', () => {
    expect(getPeriodLabel('today', 0, '', '')).toBe('Today');
    expect(getPeriodLabel('today', -1, '', '')).toBe('Yesterday');
    expect(getPeriodLabel('this_week', 0, '', '')).toBe('This Week');
    expect(getPeriodLabel('this_week', -1, '', '')).toBe('Last Week');
  });

  it('names older periods by date', () => {
    expect(getPeriodLabel('today', -2, '', '')).toBe('Nov 2, 2026');
    expect(getPeriodLabel('this_month', 0, '', '')).toBe('November 2026');
    expect(getPeriodLabel('this_year', -1, '', '')).toBe('2025');
  });

  it('labels custom ranges', () => {
    expect(getPeriodLabel('custom', 0, '2026-10-10', '2026-10-16')).toBe('Oct 10 – Oct 16');
    expect(getPeriodLabel('custom', 0, '', '')).toBe('Custom');
  });
});

describe('isInDateRange', () => {
  it('includes the whole last day', () => {
    expect(isInDateRange('2026-11-04T23:00:00', '2026-11-01T00:00:00', '2026-11-04T00:00:00')).toBe(true);
    expect(isInDateRange('2026-11-05T00:00:00', '2026-11-01T00:00:00', '2026-11-04T00:00:00')).toBe(false);
    expect(isInDateRange('2026-10-31T23:59:59', '2026-11-01T00:00:00', '2026-11-04T00:00:00')).toBe(false);
  });
});

import {
  accountPlaceholders,
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  suggestPassword,
  suggestUsername,
} from '@/features/team/utils';

describe('normalizeUsername', () => {
  test('lowercases, turns spaces into dots and drops other symbols', () => {
    expect(normalizeUsername('Ana Cruz')).toBe('ana.cruz');
    expect(normalizeUsername('Main Branch!! Counter')).toBe('main.branch.counter');
    expect(normalizeUsername('bubbly-wash_main.ana')).toBe('bubbly-wash_main.ana');
  });
});

describe('suggestUsername', () => {
  test('is "{branch}.{first name}"', () => {
    expect(suggestUsername('Bubbly Wash Main', 'Ana Cruz')).toBe('bubbly-wash-main.ana');
  });

  test('without a branch it is just the first name', () => {
    expect(suggestUsername(undefined, 'Ana Cruz')).toBe('ana');
  });

  test('no name, no suggestion', () => {
    expect(suggestUsername('Main', '   ')).toBe('');
  });
});

describe('accountPlaceholders', () => {
  test('names the shared login after the branch and role', () => {
    expect(accountPlaceholders('Main', 'staff')).toEqual({ name: 'Main Counter', username: 'main.counter' });
    expect(accountPlaceholders('Main', 'delivery')).toEqual({ name: 'Main Driver', username: 'main.driver' });
    expect(accountPlaceholders('Main', 'admin')).toEqual({ name: 'Main Manager', username: 'main.manager' });
  });
});

describe('suggestPassword', () => {
  const passwords = Array.from({ length: 200 }, () => suggestPassword());

  test('meets the minimum length', () => {
    for (const p of passwords) expect(p.length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
  });

  test('always has a capital, a number and a symbol', () => {
    for (const p of passwords) {
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[$@#!%*?]/);
    }
  });

  test('never uses look-alike characters (0/O, 1/l/I)', () => {
    for (const p of passwords) expect(p).not.toMatch(/[0O1lI]/);
  });
});

import type { TeamRole } from '@/lib/api';

export const MIN_PASSWORD_LENGTH = 8;

export const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  delivery: 'Driver',
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Usernames are typed on a tablet: keep them lowercase with no spaces.
export function normalizeUsername(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '');
}

// "{branch}.{first name}", e.g. "bubbly-wash-main.ana".
export function suggestUsername(branchName: string | undefined, personName: string): string {
  const first = slug(personName.split(/\s+/)[0] ?? '');
  if (!first) return '';
  return branchName ? `${slug(branchName)}.${first}` : first;
}

// Example name/username for the add form, based on the branch and role rather
// than a person: many shops share one counter login per tablet.
export function accountPlaceholders(
  branchName: string | undefined,
  role: 'staff' | 'delivery' | null,
): { name: string; username: string } {
  const label = role === 'delivery' ? 'Driver' : 'Counter';
  return {
    name: branchName ? `${branchName} ${label}` : label,
    username: suggestUsername(branchName, label),
  };
}

// No 0/O, 1/l/I: the owner reads this aloud or types it into a tablet.
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const DIGITS = '23456789';
// Ones on the first symbols page of a phone keyboard.
const SYMBOLS = '$@#!%*?';
const PASSWORD_LENGTH = 8;

function randomIndex(max: number): number {
  const cryptoApi = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } })
    .crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick(chars: string): string {
  return chars[randomIndex(chars.length)];
}

// Short and simple, e.g. "tef$a5wA": 8 characters, mostly lowercase, with at
// least one capital, one number and one symbol.
export function suggestPassword(): string {
  const chars = [pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < PASSWORD_LENGTH) chars.push(pick(LOWER));
  // Shuffle so the capital, number and symbol land in different places each time.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

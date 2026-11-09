// The release workflow bumps app.json's version with this script on every push to master.
const { bumpVersion, bumpFromCommits } = require('../bump-version');

describe('bumpFromCommits (auto)', () => {
  test('only fixes, tests and chores → patch', () => {
    expect(bumpFromCommits(['fix(api): stay under the rate limit', 'test: cover utils', 'chore: tidy'])).toBe('patch');
  });

  test('any feature → minor', () => {
    expect(bumpFromCommits(['fix: typo', 'feat(reconciliation): show cash on hand after expenses'])).toBe('minor');
    expect(bumpFromCommits(['feat: add customers screen'])).toBe('minor');
  });

  test('a "!" after the type or a BREAKING CHANGE footer → major', () => {
    expect(bumpFromCommits(['feat(auth)!: require the new login'])).toBe('major');
    expect(bumpFromCommits(['fix!: drop the old API'])).toBe('major');
    expect(bumpFromCommits(['feat: new plans\n\nBREAKING CHANGE: Free plan removed'])).toBe('major');
  });

  test('"feat" only counts as the commit type, not inside other words or bodies', () => {
    expect(bumpFromCommits(['fix: defeat the flaky test', 'chore: notes\n\nfeat: mentioned in body'])).toBe('patch');
    expect(bumpFromCommits(["Merge branch 'develop' into master"])).toBe('patch');
  });

  test('no commits → patch', () => {
    expect(bumpFromCommits([])).toBe('patch');
  });
});

describe('bumpVersion', () => {
  test.each([
    ['1.4.0', 'patch', '1.4.1'],
    ['1.4.9', 'patch', '1.4.10'],
    ['1.4.3', 'minor', '1.5.0'],
    ['1.4.3', 'major', '2.0.0'],
  ])('%s + %s → %s', (current, part, next) => {
    expect(bumpVersion(current, part)).toBe(next);
  });

  test('rejects an unknown part', () => {
    expect(() => bumpVersion('1.4.0', 'build')).toThrow(/Unknown version part/);
  });

  test('rejects a version that is not MAJOR.MINOR.PATCH', () => {
    expect(() => bumpVersion('1.4', 'patch')).toThrow(/MAJOR.MINOR.PATCH/);
    expect(() => bumpVersion('v1.4.0', 'patch')).toThrow(/MAJOR.MINOR.PATCH/);
  });
});

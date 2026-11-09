// The release workflow bumps app.json's version with this script on every push to master.
const { bumpVersion } = require('../bump-version');

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

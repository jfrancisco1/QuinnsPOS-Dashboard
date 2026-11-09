// Guards the release setup: a change here would break or silently alter what reaches
// Google Play on the next merge to master (see docs/release.md).
const appJson = require('../../app.json');
const easJson = require('../../eas.json');

describe('app.json', () => {
  test('version is MAJOR.MINOR.PATCH so the release workflow can bump it', () => {
    expect(appJson.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('Android package name never changes (Play would treat it as a new app)', () => {
    expect(appJson.expo.android.package).toBe('com.jfrancisco2.quinnsposdashboard');
  });

  test('release builds are minified with R8 (Play Console DEX optimization)', () => {
    const buildProps = appJson.expo.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-build-properties',
    );
    expect(buildProps).toBeDefined();
    expect(buildProps[1].android.enableMinifyInReleaseBuilds).toBe(true);
  });
});

describe('eas.json', () => {
  test('versionCode is managed by EAS and incremented on every production build', () => {
    expect(easJson.cli.appVersionSource).toBe('remote');
    expect(easJson.build.production.autoIncrement).toBe(true);
  });

  test('production builds an app bundle for Play', () => {
    expect(easJson.build.production.android.buildType).toBe('app-bundle');
  });

  test('preview builds an installable APK', () => {
    expect(easJson.build['preview-android'].android.buildType).toBe('apk');
  });

  test('production submits to the Play production track', () => {
    expect(easJson.submit.production.android.track).toBe('production');
  });
});

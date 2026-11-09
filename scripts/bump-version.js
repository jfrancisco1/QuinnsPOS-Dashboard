#!/usr/bin/env node
// Bumps `expo.version` in app.json (the version users see on Google Play) and prints the new
// version. Used by .github/workflows/release.yml on every push to master.
//
//   node scripts/bump-version.js [patch|minor|major]   (default: patch)
//
// versionCode is not touched here: EAS increments it (eas.json → appVersionSource: "remote").
const fs = require('fs');
const path = require('path');

const PARTS = ['patch', 'minor', 'major'];

function bumpVersion(current, part) {
  if (!PARTS.includes(part)) {
    throw new Error(`Unknown version part "${part}" (use patch, minor or major)`);
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) {
    throw new Error(`app.json expo.version "${current}" is not MAJOR.MINOR.PATCH`);
  }
  let [major, minor, patch] = match.slice(1).map(Number);
  if (part === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (part === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

module.exports = { bumpVersion };

if (require.main === module) {
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const next = bumpVersion(appJson.expo.version, process.argv[2] || 'patch');
    appJson.expo.version = next;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    process.stdout.write(next + '\n');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

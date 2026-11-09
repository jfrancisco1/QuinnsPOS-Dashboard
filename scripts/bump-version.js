#!/usr/bin/env node
// Bumps `expo.version` in app.json (the version users see on Google Play) and prints the new
// version. Used by .github/workflows/release.yml on every push to master.
//
//   node scripts/bump-version.js [auto|patch|minor|major]   (default: auto)
//
// `auto` reads the commit messages since the last `vX.Y.Z` tag (conventional commits):
//   - `feat!:` / `fix(scope)!:` or "BREAKING CHANGE" in a message → major
//   - any `feat:` / `feat(scope):`                                  → minor
//   - anything else (fix, test, chore, …)                          → patch
//
// versionCode is not touched here: EAS increments it (eas.json → appVersionSource: "remote").
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PARTS = ['patch', 'minor', 'major'];

// Picks the bump for a release from the full messages of the commits it contains.
function bumpFromCommits(messages) {
  let part = 'patch';
  for (const message of messages) {
    const subject = message.split('\n')[0];
    if (/^\w+(\([^)]*\))?!:/.test(subject) || /^BREAKING[ -]CHANGE:/m.test(message)) return 'major';
    if (/^feat(\([^)]*\))?:/.test(subject)) part = 'minor';
  }
  return part;
}

// Full messages of the commits since the newest vX.Y.Z tag (all history when there is none).
function commitsSinceLastRelease() {
  const git = (args) => execFileSync('git', args, { encoding: 'utf8' });
  let range = 'HEAD';
  try {
    range = `${git(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']).trim()}..HEAD`;
  } catch {
    // No release tag yet.
  }
  return git(['log', range, '--format=%B%x00'])
    .split('\0')
    .map((m) => m.trim())
    .filter(Boolean);
}

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

module.exports = { bumpVersion, bumpFromCommits };

if (require.main === module) {
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const requested = process.argv[2] || 'auto';
    const part = requested === 'auto' ? bumpFromCommits(commitsSinceLastRelease()) : requested;
    const next = bumpVersion(appJson.expo.version, part);
    // stderr, so the workflow's log says why without changing what it reads from stdout.
    console.error(`${requested === 'auto' ? 'auto → ' : ''}${part}: ${appJson.expo.version} → ${next}`);
    appJson.expo.version = next;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    process.stdout.write(next + '\n');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

# Release Guide — Google Play

Package: `com.jfrancisco2.quinnsposdashboard`

## Automated (GitHub Actions + EAS)

Checks and the release run on **GitHub Actions** (`.github/workflows/`). The builds themselves
run on EAS (Expo's servers): the release workflow starts the production build with
`eas build`, and the preview APK is an **EAS Workflow** (`.eas/workflows/preview.yml`).

```
feature/*  ──PR──▶  develop  ──merge──▶  master
             checks   preview APK         production .aab → Play
                      (manual)
```

> **Every merge into `master` goes to Play production.** `.github/workflows/release.yml`
> bumps the version, then builds the `.aab` on EAS and uploads it to the production track
> with the service account key stored on EAS. One EAS build per merge — batch changes into
> one `develop` → `master` PR to save build quota.

| Event | GitHub Actions | EAS |
|---|---|---|
| PR into `develop` / `master` | Type-check + lint + unit tests | — |
| Push to `develop` | Type-check + lint + unit tests | — |
| *Run workflow* in Actions, or `npm run preview:android` | Starts the EAS run (`preview-apk.yml`) | **preview APK** of the chosen branch (`preview-android` profile, `preview.yml`) |
| Push to `master` | Type-check + lint + unit tests; **bumps the version** (patch/minor/major from the commit messages), commits + tags it (`release.yml`) | **production .aab** + upload to Play production (`eas build --auto-submit`) |
| *Run workflow* on **Dashboard release** | Same, with `auto` or the part you pick | Same |

Check and release runs show on the PR and in the repo's *Actions* tab. Builds show on
expo.dev → **jfrancisco2** → **QuinnsPOS-Dashboard** → *Builds* (preview runs under
*Workflows*).

**The release doesn't wait for the checks.** A push to `master` starts the release even
when the checks on that commit fail. Branch protection on `master` is what stops a broken
release: require a pull request and the **Type-check, lint and test** status check before
merging (see *One-time setup*).

**The preview APK is manual.** Pushes to `develop` don't build anything. When you want to
test on a phone, start it one of two ways (each run uses EAS build quota, and builds the
branch as it is on GitHub, so push first):
- **GitHub:** *Actions* → **Dashboard preview APK** → *Run workflow* → pick the branch
  (`.github/workflows/preview-apk.yml`). Needs the `EXPO_TOKEN` repo secret, and the button
  only shows once that file is on `master`.
- **Terminal:** `npm run preview:android` builds `develop`. For another branch:
  `npx eas-cli@latest workflow:run .eas/workflows/preview.yml --ref <branch>`.

### Unit tests
`npm test` runs Jest on the app's logic — no screens:

| Suite | Covers |
|---|---|
| `lib/__tests__/date-helpers.test.ts` | Day/week/month/year ranges, the like-for-like comparison period, period labels, range checks |
| `lib/__tests__/plan.test.ts` | Trial days left, overdue/lapsed payment status and the grace period, plan limits, peso and API date formatting |
| `lib/__tests__/api-client.test.ts` | Login, bearer token, 401 sign-out, validation messages, offline fallback to the saved copy, report response shapes |
| `lib/__tests__/api-rate-limit.test.ts` | Staying under the API's 60/min limit: reused GET answers, shared in-flight requests, writes and pull-to-refresh clearing them, 429 fallback |
| `lib/__tests__/offline-cache.test.ts` | Saving/reading the last answers, oversize entries, eviction past the budget, clearing on logout |
| `features/*/__tests__/utils.test.ts` | Order/payment labels and badges, peso formatting, add-on categories, usernames and suggested passwords, Reconciliation cash on hand |
| `scripts/__tests__/bump-version.test.ts` | The release version bump: picking patch/minor/major from commit messages, applying it, bad input |
| `scripts/__tests__/release-config.test.ts` | Release guards in `app.json`/`eas.json`: version format, package name, R8, versionCode auto-increment, `.aab` + production track |

### Releasing through the pipeline
1. Push/merge to `develop`, start the preview APK (Actions → *Run workflow*, or
   `npm run preview:android`), then install the APK from expo.dev on a phone and check it.
2. Open a PR from `develop` into `master`. Merge it once **Type-check, lint and test**
   passes. The release workflow bumps the version (see below), commits
   `chore: release vX.Y.Z [skip ci]` to `master`, tags `vX.Y.Z`, and runs
   `eas build -p android --profile production --auto-submit`. It goes live once Google's
   review passes (or when you press *Publish*, if *Managed publishing* is on in Play
   Console). Add release notes in Play Console if you want.

### How the version is bumped
- `version` lives in `app.json` (`expo.version`); `scripts/bump-version.js` bumps it.
- Each push to `master` picks the part from the commit messages since the last `vX.Y.Z`
  tag (conventional commits), so nothing is done by hand:
  - any `feat:` / `feat(scope):` → **minor** (`1.4.1` → `1.5.0`)
  - `feat!:` / `fix(scope)!:` or `BREAKING CHANGE:` in a message → **major** (`2.0.0`)
  - otherwise (`fix:`, `test:`, `chore:`, …) → **patch** (`1.4.2`)
- To force a part: merge with `[skip release]` in the merge commit message, then *Actions* →
  **Dashboard release** → *Run workflow* on `master` and pick it (default `auto`).
- To push to `master` without releasing, put `[skip release]` in the commit message.
- `versionCode` (the number Play shows next to the version, e.g. `9 (1.4.1)`) is separate
  and must go up on every upload — EAS auto-increments it (`appVersionSource: "remote"` +
  `autoIncrement`). `android/` is gitignored — EAS runs prebuild itself.
- Never bump `version` by hand on `develop`; the bump only happens on `master`. Merge
  `master` back into `develop` now and then to keep the number in sync there.

### One-time setup
- **Branch protection:** GitHub → repo *Settings* → *Branches* (or *Rules*) → protect
  `master`: require a pull request before merging, and require the status check
  **Type-check, lint and test**. The check appears in the list after it has run once.
  The release workflow pushes the version-bump commit and tag straight to `master`, which
  the rule would reject, so:
  1. Let admins bypass it: uncheck *Do not allow bypassing the above settings* (classic
     rule), or add *Repository admin* to the ruleset's bypass list.
  2. Create a fine-grained token as the admin (github.com → *Settings* → *Developer
     settings* → *Fine-grained tokens*): only this repository, *Contents: Read and write*.
  3. Save it as the `RELEASE_TOKEN` repo secret. The workflow checks out and pushes with it.
  Without these the bump step fails and no build starts. The token expires — renew the
  secret when it does.
- **`EXPO_TOKEN` repo secret:** expo.dev → *Account settings* → *Access tokens*; add it under
  GitHub → *Settings* → *Secrets and variables* → *Actions*. Used by the release and the
  preview APK.
- **Link GitHub to EAS:** expo.dev → project **QuinnsPOS-Dashboard** (owner `jfrancisco2`) →
  *Project settings* → *GitHub* → connect `jfrancisco1/QuinnsPOS-Dashboard`. The preview
  APK (an EAS Workflow) needs this.
- **Play uploads (done):** service account
  `eas-play-upload@quinns-pos.iam.gserviceaccount.com` (Google Cloud project *Quinns POS*).
  Its JSON key is stored on EAS: expo.dev → project → *Credentials* → Android → *Google
  Service Account Key for Play Store Submissions* (or `eas credentials -p android`). Never
  commit it. In Play Console → *Users and permissions* it has *View app information*,
  *Release to production* and *Release apps to testing tracks*. The same key is what
  `npm run deploy:android` / `submit:android` use.
- **Turning off Play uploads:** drop `--auto-submit` from the last step of
  `.github/workflows/release.yml`; `master` then only builds the `.aab`.
- **Validating EAS workflow files:** use the latest CLI. Older global installs fail with
  "reading 'const'":
  ```bash
  npx -y eas-cli@latest workflow:validate .eas/workflows/preview.yml
  ```

---

## Manual release (without the pipeline)

## Commands

| Command | What it does |
| --- | --- |
| `npm run build:android` | Builds a production `.aab` on EAS (download it from the build link) |
| `npm run deploy:android` | Builds **and** uploads to Play Console's production track |
| `npm run submit:android` | Uploads the latest finished build without rebuilding |

`versionCode` is incremented automatically. You only change `"version"` in `app.json`
(`node scripts/bump-version.js patch|minor|major`). Do this on `master` so the pipeline's
next bump starts from it.

---

## First release (one time)

**Terminal**

```bash
npm i -g eas-cli
eas login
npm run build:android      # when asked, let EAS generate a new keystore
```

**Play Console**

1. **Create app**: name `QuinnsPOS Dashboard`, type App, Free.
2. **Dashboard → Set up your app**. Complete every item:
   - Privacy policy URL
   - App access: give reviewers a **demo login**
   - Ads: No · Content rating · Target audience: 18+ · Data safety · Declarations
   - Store listing: 512×512 icon, 1024×500 feature graphic, 2+ screenshots, short and full descriptions
3. **Testing → Internal testing → Create release**. Upload the `.aab` **by hand**, because Google requires the first upload to be manual. Then roll it out.
4. Promote to **Closed testing**, then **apply for production access**, then promote to **Production**.
   - Personal accounts: the closed test needs **12 testers for 14 days** before you can apply for production access.

**Enable `npm run deploy:android`** (one time, after the first manual upload)

1. Google Cloud Console: create a service account and download its JSON key.
2. Store the key on EAS: `eas credentials -p android` → production → Google Service Account → upload key. Don't commit it (`play-service-account.json` is gitignored if you keep a local copy).
3. Play Console → **Users and permissions**: invite the service account email and give it release permissions.

---

## Every update

**Terminal**

```bash
# 1. Bump "version" in app.json (e.g. 1.4.0 → 1.5.0)
npm run lint
git commit -am "chore: release v1.5.0" && git tag v1.5.0 && git push --follow-tags
npm run deploy:android
```

**Play Console**

1. **Production**: the new build is there and sent for review. Add release notes if you want.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Version code already used" | Run `eas build:version:set -p android` and set a higher number |
| `deploy:android` fails with "upload an APK or App Bundle first" | The first upload must be manual |
| Service account "permission denied" | Check its permissions in Play Console. A new invite can take a few minutes to start working |
| Review rejected for app access | Make sure the demo login still works |

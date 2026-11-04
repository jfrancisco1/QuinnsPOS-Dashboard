# Release Guide — Google Play

Package: `com.jfrancisco2.quinnsposdashboard`

## Automated (GitHub Actions + EAS Workflows)

Checks run on **GitHub Actions** (`.github/workflows/checks.yml`). Builds run on **EAS Workflows** (Expo's servers, `.eas/workflows/`, next to `eas.json`). GitHub
triggers both.

```
feature/*  ──PR──▶  develop  ──merge──▶  master
             checks   preview APK         production .aab
```

> **Play upload is off for now.** `release.yml` builds the `.aab` but doesn't upload it,
> because the Play service account key and production access aren't set up yet. Upload the
> `.aab` by hand (see *First release*). To turn the upload on, see *Turning on Play uploads*.

| Event | GitHub Actions | EAS |
|---|---|---|
| PR into `develop` / `master` | Type-check + lint + unit tests | — |
| Push to `develop` | Type-check + lint + unit tests | **preview APK** (`preview-android` profile, `preview.yml`) |
| Push to `master` | Type-check + lint + unit tests | **production .aab** (`release.yml`) — no Play upload yet |

Check runs show on the PR and in the repo's *Actions* tab. Build runs show on expo.dev →
**jfrancisco2** → **QuinnsPOS-Dashboard** → *Workflows*.

**The EAS build doesn't wait for GitHub.** A push to `master` starts the release build even
when the checks on that commit fail. Branch protection on `master` is what stops a broken
release: require a pull request and the **Type-check, lint and test** status check before
merging (see *One-time setup*).

**Every push to `develop` builds an APK** and uses EAS build quota, so batch work on a
feature branch and merge it once instead of pushing small commits straight to `develop`.

### Unit tests
`npm test` runs Jest on the app's logic — no screens:

| Suite | Covers |
|---|---|
| `lib/__tests__/date-helpers.test.ts` | Day/week/month/year ranges, the like-for-like comparison period, period labels, range checks |
| `lib/__tests__/plan.test.ts` | Trial days left, overdue/lapsed payment status and the grace period, plan limits, peso and API date formatting |

### Releasing through the pipeline
1. On `develop`, bump `version` in `app.json`. `versionCode` is incremented by EAS
   (`appVersionSource: "remote"` + `autoIncrement`). `android/` is gitignored — EAS runs
   prebuild itself.
2. Push/merge to `develop` → install the preview APK from expo.dev on a phone and check it.
3. Open a PR from `develop` into `master`. Merge it once **Type-check, lint and test**
   passes. The `.aab` is built on EAS. Download it from expo.dev and upload it in Play
   Console. Once Play uploads are on, it's uploaded to the production track automatically
   and goes live once Google's review passes (or when you press *Publish*, if *Managed
   publishing* is on in Play Console).

### One-time setup
- **Branch protection:** GitHub → repo *Settings* → *Branches* (or *Rules*) → protect
  `master`: require a pull request before merging, and require the status check
  **Type-check, lint and test**. The check appears in the list after it has run once.
- **Link GitHub to EAS:** expo.dev → project **QuinnsPOS-Dashboard** (owner `jfrancisco2`) →
  *Project settings* → *GitHub* → connect `jfrancisco1/QuinnsPOS-Dashboard`. Until this is
  done, no EAS build runs.
- **Play uploads:** store the service account key on EAS (never commit it):
  ```bash
  eas credentials -p android   # → production → Google Service Account → upload key
  ```
  The key on EAS is also what `npm run deploy:android` / `submit:android` use.
- **Production access:** uploads to the production track only work once the app has
  production access in Play Console (see *First release* below).
- **Turning on Play uploads:** once the key and production access are in place, add the
  `submit_play` job back to `.eas/workflows/release.yml` (it's in the file's header
  comment) and validate the file. From then on, every merge into `master` goes to Play
  production.
- **Validating EAS workflow files:** use the latest CLI. Older global installs fail with
  "reading 'const'":
  ```bash
  npx -y eas-cli@latest workflow:validate .eas/workflows/release.yml
  ```

---

## Manual release (without the pipeline)

## Commands

| Command | What it does |
| --- | --- |
| `npm run build:android` | Builds a production `.aab` on EAS (download it from the build link) |
| `npm run deploy:android` | Builds **and** uploads to Play Console's production track |
| `npm run submit:android` | Uploads the latest finished build without rebuilding |

`versionCode` is incremented automatically. You only change `"version"` in `app.json`.

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

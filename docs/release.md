# Release Guide — Google Play

Package: `com.jfrancisco2.quinnsposdashboard`

## Automated (GitHub Actions + EAS Workflows)

Checks run on **GitHub Actions** (`.github/workflows/checks.yml`). Builds run on **EAS Workflows** (Expo's servers, `.eas/workflows/`, next to `eas.json`). GitHub
triggers both.

```
feature/*  ──PR──▶  develop  ──merge──▶  master
             checks   preview APK         production .aab → Play
                      (manual)
```

> **Every merge into `master` goes to Play production.** `release.yml` builds the `.aab`
> and uploads it to the production track with the service account key stored on EAS.

| Event | GitHub Actions | EAS |
|---|---|---|
| PR into `develop` / `master` | Type-check + lint + unit tests | — |
| Push to `develop` | Type-check + lint + unit tests | — |
| *Run workflow* in Actions, or `npm run preview:android` | Starts the EAS run (`preview-apk.yml`) | **preview APK** of the chosen branch (`preview-android` profile, `preview.yml`) |
| Push to `master` | Type-check + lint + unit tests | **production .aab** + upload to Play production (`release.yml`) |

Check runs show on the PR and in the repo's *Actions* tab. Build runs show on expo.dev →
**jfrancisco2** → **QuinnsPOS-Dashboard** → *Workflows*.

**The EAS build doesn't wait for GitHub.** A push to `master` starts the release build even
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

### Releasing through the pipeline
1. On `develop`, bump `version` in `app.json`. `versionCode` is incremented by EAS
   (`appVersionSource: "remote"` + `autoIncrement`). `android/` is gitignored — EAS runs
   prebuild itself.
2. Push/merge to `develop`, start the preview APK (Actions → *Run workflow*, or
   `npm run preview:android`), then install the APK from expo.dev on a phone and check it.
3. Open a PR from `develop` into `master`. Merge it once **Type-check, lint and test**
   passes. The `.aab` is built on EAS and uploaded to the production track automatically.
   It goes live once Google's review passes (or when you press *Publish*, if *Managed
   publishing* is on in Play Console). Add release notes in Play Console if you want.

### One-time setup
- **Branch protection:** GitHub → repo *Settings* → *Branches* (or *Rules*) → protect
  `master`: require a pull request before merging, and require the status check
  **Type-check, lint and test**. The check appears in the list after it has run once.
- **Link GitHub to EAS:** expo.dev → project **QuinnsPOS-Dashboard** (owner `jfrancisco2`) →
  *Project settings* → *GitHub* → connect `jfrancisco1/QuinnsPOS-Dashboard`. Until this is
  done, no EAS build runs.
- **Play uploads (done):** service account
  `eas-play-upload@quinns-pos.iam.gserviceaccount.com` (Google Cloud project *Quinns POS*).
  Its JSON key is stored on EAS: expo.dev → project → *Credentials* → Android → *Google
  Service Account Key for Play Store Submissions* (or `eas credentials -p android`). Never
  commit it. In Play Console → *Users and permissions* it has *View app information*,
  *Release to production* and *Release apps to testing tracks*. The same key is what
  `npm run deploy:android` / `submit:android` use.
- **Turning off Play uploads:** remove the `submit_play` job from
  `.eas/workflows/release.yml`; `master` then only builds the `.aab`.
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

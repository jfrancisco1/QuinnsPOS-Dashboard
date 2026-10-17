# Release Guide — Google Play

Package: `com.jfrancisco2.quinnsposdashboard`

## Commands

| Command | What it does |
| --- | --- |
| `npm run build:android` | Builds a production `.aab` on EAS (download it from the build link) |
| `npm run deploy:android` | Builds **and** uploads to Play Console's internal track |
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
2. Save the key as `play-service-account.json` in the project root. It's already gitignored.
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

1. **Testing → Internal testing**: the new build is there. Add release notes.
2. **Promote release → Production**, then send it for review.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Version code already used" | Run `eas build:version:set -p android` and set a higher number |
| `deploy:android` fails with "upload an APK or App Bundle first" | The first upload must be manual |
| Service account "permission denied" | Check its permissions in Play Console. A new invite can take a few minutes to start working |
| Review rejected for app access | Make sure the demo login still works |

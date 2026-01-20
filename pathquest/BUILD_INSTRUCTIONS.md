# Google Play Production Build Instructions

## ✅ Configuration Complete

- ✅ EAS configured for Android App Bundle (AAB) production builds
- ✅ Auto-increment version codes enabled
- ✅ Google Play App Signing (handled automatically by EAS)
- ✅ EAS Workflows configured for CI/CD

---

## 🔄 CI/CD Setup (One-Time)

### Prerequisites for Automated Submission

Before CI/CD can submit to Google Play, you need to set up a Google Service Account:

### Step 1: Create Google Cloud Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/projectcreate)
2. Create a new project (or use existing)

### Step 2: Create Service Account
1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **Create Service Account**
3. Name it something like "eas-submit-pathquest"
4. Click **Done**

### Step 3: Create & Download JSON Key
1. Click on your new service account
2. Go to **Keys** tab → **Add Key** → **Create new key**
3. Choose **JSON** and download the file
4. Save it securely (don't commit to git!)

### Step 4: Enable Google Play API
1. Go to [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
2. Click **Enable**

### Step 5: Invite Service Account to Play Console
1. Go to [Google Play Console → Users & Permissions](https://play.google.com/console/users-and-permissions)
2. Click **Invite new users**
3. Enter the service account email (from Step 2)
4. Under **App permissions**, select your app
5. Grant these permissions:
   - ✅ Release to production, exclude devices, and use Play App Signing
   - ✅ Release apps to testing tracks
   - ✅ Manage testing tracks and edit tester lists
6. Click **Invite user**

### Step 6: Upload Key to EAS
```bash
npx eas credentials --platform android
# Select: production
# Select: Google Service Account > Upload a Google Service Account Key
# Provide path to your downloaded JSON key
```

**Alternative:** Upload via EAS Dashboard:
1. Go to https://expo.dev → Your Project → Credentials → Android
2. Under **Service Credentials**, click **Add a Google Service Account Key**
3. Upload the JSON key

---

## 🚀 Building for Google Play

### Step 1: Ensure You're Logged In
```bash
npx eas login
```

### Step 2: Build Production AAB
```bash
npx eas build --platform android --profile production
```

This will:
- Build an Android App Bundle (AAB) - required for Google Play
- Automatically increment version code
- Use Google Play App Signing (EAS handles this automatically)
- Upload to EAS servers

### Step 3: Download the Build
After the build completes, EAS will provide a download link. You can also:
```bash
npx eas build:list --platform android --profile production
```

### Step 4: Upload to Google Play Console

**Option A: Manual Upload**
1. Go to Google Play Console → Your App → Release → Production (or Internal Testing)
2. Click "Create new release"
3. Upload the `.aab` file from EAS
4. Fill in release notes
5. Review and publish

**Option B: Automated Upload (if you set up service account)**
```bash
npx eas submit --platform android --profile production
```

## 📋 Pre-Upload Checklist

Before uploading to Play Console, make sure you have:

- [x] Privacy Policy URL: `https://pathquest.app/privacy`
- [x] Terms of Service URL: `https://pathquest.app/terms`
- [x] App screenshots (2-8 images)
- [x] Feature graphic (1024x500px)
- [x] Short description (80 chars)
- [x] Full description (4000 chars)
- [ ] Complete Data Safety form
- [ ] Complete Content Rating questionnaire
- [ ] Set target audience (13+)
- [x] Demo login configured for Google Play reviewers (see below)

## 🔑 App Signing

**Google Play App Signing** is automatically configured by EAS:
- EAS generates an upload key
- Google Play manages the app signing key
- You don't need to manually manage keys

## 📱 Version Management

- **Version Name**: Set in `app.json` → `version` (currently "1.0.0")
- **Version Code**: Auto-incremented by EAS (`autoIncrement: true`)

To update version name:
```json
// app.json
{
  "expo": {
    "version": "1.0.1"  // Update this
  }
}
```

## 🐛 Troubleshooting

### Build Fails
- Check EAS build logs: `npx eas build:view [build-id]`
- Ensure all secrets are set: `npx eas secret:list`
- Verify `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` is set

### Upload Fails
- Ensure Google Play Console app is created
- Check package name matches: `app.pathquest`
- Verify service account has correct permissions (if using automated submit)

## 📝 Next Steps After Build

1. **Test the AAB** (optional): Download and test on a device using `bundletool`
2. **Upload to Internal Testing** first (recommended)
3. **Test with internal testers**
4. **Promote to Production** after testing

## 🔗 Useful Commands

```bash
# List all builds
npx eas build:list

# View build details
npx eas build:view [build-id]

# Download build
npx eas build:download [build-id]

# Check build status
npx eas build:list --platform android --limit 1
```

---

## 🔄 CI/CD Workflows

### Available Workflows

Two EAS Workflows are configured in `.eas/workflows/`:

#### 1. `deploy-android.yml` (Automatic)
- **Trigger:** Push to `main` branch
- **Behavior:**
  - Calculates fingerprint to detect native changes
  - If native changes detected → Build + Submit to Google Play (internal track)
  - If no native changes → Publish OTA update instead

#### 2. `build-and-submit-android.yml` (Manual)
- **Trigger:** Manual only
- **Behavior:** Always builds and submits to Google Play

### Running Workflows

```bash
# Run the manual build & submit workflow
npx eas workflow:run build-and-submit-android.yml

# List workflow runs
npx eas workflow:list

# View workflow run details
npx eas workflow:view [run-id]
```

### How It Works

```
Push to main
     ↓
Calculate Fingerprint
     ↓
Check for existing build with same fingerprint
     ↓
┌────────────────────────────────────────┐
│                                        │
↓ (Native changes detected)              ↓ (No native changes)
Build Android AAB                        Publish OTA Update
     ↓                                        ↓
Submit to Google Play               Users get update instantly
(internal track)                    (no store review needed)
```

### Promoting from Internal to Production

After testing on the internal track:
1. Go to Google Play Console → Your App → Release → Internal Testing
2. Click **Promote release** → **Production**
3. Complete release notes and submit for review

---

## 🔐 Demo Login for Google Play Reviewers

Since PathQuest requires Strava OAuth (which requires a real Strava account with 2FA), we've implemented a **demo login** for Google Play reviewers to test the app without needing their own Strava account.

### How It Works

1. **Hidden Trigger**: Tap the PathQuest logo **5 times** on the login screen
2. **Demo Login Form**: A password field appears
3. **Reviewer Enters Password**: Using credentials you provide in Play Console
4. **Direct Login**: Bypasses Strava OAuth entirely

### Setup Instructions

#### Step 1: Set Environment Variables on API

Add these to your production API environment (Cloud Run, Vercel, etc.):

```bash
DEMO_USER_PASSWORD=<choose-a-secure-password>
DEMO_USER_ID=demo-reviewer
```

**Example:**
```bash
DEMO_USER_PASSWORD=PathQuestReview2026!
DEMO_USER_ID=demo-reviewer
```

#### Step 2: (Optional) Pre-seed Demo Data

The demo user is created automatically on first login, but it will have no summit data. To make the review more impressive, you can:

1. Manually add some summits to the demo user via the database
2. Or leave it empty (they can still explore the app's features)

#### Step 3: Provide Credentials to Google Play

In Google Play Console → App Access → Instructions for reviewers:

```
To test the full app functionality:

1. On the login screen, tap the PathQuest logo 5 times
2. A "Demo Login" form will appear
3. Enter password: [YOUR_DEMO_PASSWORD]
4. Click "Sign In"

This allows you to test all features without needing a Strava account.
```

### Security Notes

- The demo login is **password-protected** - it can't be exploited without the password
- The demo user has limited permissions (no Strava sync, no activity uploads)
- The password should be changed periodically
- Demo login only works if `DEMO_USER_PASSWORD` is set on the API

---

## 🚨 Important Notes

### First Submission Requirement
**You must upload your first build manually** before CI/CD can work. This is a Google Play API limitation.

1. Download the AAB from EAS
2. Upload manually to Google Play Console
3. After that, CI/CD can handle subsequent submissions

### Track Configuration
The `eas.json` is configured to submit to the `internal` track by default. This means:
- Builds go to internal testing first
- You manually promote to production after testing
- This is the safest approach for production apps

To change to direct production submission (not recommended):
```json
{
  "submit": {
    "production": {
      "android": {
        "track": "production"  // Changed from "internal"
      }
    }
  }
}
```


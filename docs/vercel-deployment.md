# Complete Vercel Deployment Guide — Dharashiv Foundation

This guide provides step-by-step instructions for deploying the **Dharashiv Foundation** frontend to **Vercel** and connecting it with live **Supabase** and **Amazon Web Services (AWS S3)** cloud backends.

---

## 1. Prerequisites

Before deploying to Vercel, ensure you have:
1. A [GitHub](https://github.com) account.
2. A [Vercel](https://vercel.com) account (you can sign up with GitHub).
3. The project repository pushed to GitHub.

---

## 2. Deploying to Vercel via GitHub (Recommended GUI Method)

### Step A: Push Project to GitHub
In your project directory terminal:
```bash
git init
git add .
git commit -m "Initial commit - Dharashiv Foundation Cloud Network"
git branch -M main
git remote add origin https://github.com/<your-username>/dharashiv-foundation.git
git push -u origin main
```

### Step B: Import Project in Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Under **Import Git Repository**, choose your `dharashiv-foundation` repository and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset:** Select **Other**.
   - **Root Directory:** Leave as `./` (default).
   - **Build & Development Settings:**
     - Build Command: *(Leave blank / Overridden to empty)*
     - Output Directory: *(Leave blank / Overridden to empty)*
     - Install Command: *(Leave blank)*
5. Click **Deploy**.

Vercel will detect [`vercel.json`](../vercel.json) and deploy your static HTML5/CSS3/Vanilla JS application in less than 30 seconds. Your project will receive a live URL like:
```
https://dharashiv-foundation.vercel.app
```

---

## 3. Alternative: Deploying via Vercel CLI

If you prefer deploying directly from your terminal:
```bash
npm install -g vercel
vercel login
vercel --prod
```
When prompted:
- Set up and deploy? `Y`
- Which scope? `Your account`
- Link to existing project? `N`
- What's your project's name? `dharashiv-foundation`
- In which directory is your code located? `./`
- Want to modify settings? `N`

---

## 4. Connecting the Vercel Frontend to Cloud Services

Once your Vercel URL is generated (e.g. `https://dharashiv-foundation.vercel.app`), configure Google OAuth, Supabase, and AWS CORS to recognize it.

### A. Whitelist Vercel Domain in Google Cloud Console
1. Open [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Click your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized JavaScript origins**, click **Add URI** and enter:
   ```
   https://dharashiv-foundation.vercel.app
   ```
4. Click **Save**.

### B. Whitelist Vercel Domain in Supabase Auth
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication > URL Configuration**.
2. Set **Site URL** to:
   ```
   https://dharashiv-foundation.vercel.app
   ```
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://dharashiv-foundation.vercel.app/auth-callback.html
   https://dharashiv-foundation.vercel.app/**
   ```
4. Click **Save**.

### C. Whitelist Vercel Domain in AWS S3 CORS
1. Open [AWS S3 Console](https://console.aws.amazon.com/s3) > Click your bucket `dharashiv-foundation-storage`.
2. Go to the **Permissions** tab > **Cross-origin resource sharing (CORS)**.
3. Add your Vercel domain to `AllowedOrigins`:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://dharashiv-foundation.vercel.app",
      "https://*.supabase.co"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
4. Click **Save changes**.

---

## 5. Supplying Live Credentials to Frontend

Open [`js/config.js`](../js/config.js) and paste your live Supabase project details:

```javascript
export const CONFIG = {
  // Replace placeholders with your live Supabase project credentials:
  SUPABASE_URL: 'https://xyzcompany.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yourLiveAnonKeyHere...',

  AWS_REGION: 'ap-south-1',
  AWS_S3_BUCKET: 'dharashiv-foundation-storage',
  // ...
};
```

Commit and push this change to your repository:
```bash
git add js/config.js
git commit -m "Configure live Supabase project credentials"
git push
```
Vercel will automatically redeploy the latest commit with live cloud connectivity enabled!

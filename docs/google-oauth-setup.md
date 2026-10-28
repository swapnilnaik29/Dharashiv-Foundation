# Google OAuth Setup Guide — Dharashiv Foundation

The platform uses Google OAuth exclusively via official Supabase Auth. Follow these instructions to generate credentials in the Google Cloud Console.

---

## 1. Configure Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `dharashiv-foundation`).
3. Navigate to **APIs & Services > OAuth consent screen**.
4. Select **External** and click **Create**.
5. Fill in the consent screen details:
   - **App Name:** `Dharashiv Foundation`
   - **User Support Email:** Your email.
   - **Developer Contact Information:** Your email.
6. Under **Scopes**, ensure the standard scopes are selected:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
7. Click **Save and Continue**.

---

## 2. Create OAuth 2.0 Client ID

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Application type:** `Web application`.
4. Name: `Dharashiv Foundation Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - `https://your-production-domain.com`
6. Under **Authorized redirect URIs**, add your Supabase Auth callback URL:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 3. Configure Supabase Auth Provider

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication > Providers > Google**.
3. Toggle **Enable Google provider** to ON.
4. Paste:
   - **Client ID:** `<your-google-client-id>`
   - **Client Secret:** `<your-google-client-secret>`
5. Click **Save**.

---

## 4. Redirect URL Whitelisting in Supabase

1. In Supabase Dashboard, go to **Authentication > URL Configuration**.
2. Set **Site URL** to:
   - `http://localhost:3000` (for local development)
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth-callback.html`
   - `http://127.0.0.1:3000/auth-callback.html`
   - `https://your-domain.com/auth-callback.html`
4. Click **Save**.

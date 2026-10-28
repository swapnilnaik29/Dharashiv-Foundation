# Supabase Setup Guide — Dharashiv Foundation

This document provides step-by-step instructions to configure the Supabase PostgreSQL database, Row Level Security (RLS) policies, Realtime engine, and Edge Functions for the Dharashiv Foundation platform.

---

## 1. Create a Supabase Project

1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project**.
3. Set:
   - **Project Name:** `Dharashiv-Foundation`
   - **Database Password:** Store securely.
   - **Region:** `ap-south-1` (Mumbai / Asia South) for minimal latency in Maharashtra.
4. Once provisioned, note down your **Project URL** and **anon public API key** from **Project Settings > API**.

---

## 2. Execute SQL Migrations

Navigate to the **SQL Editor** in your Supabase dashboard and run the migrations in sequential order from `supabase/migrations/`:

1. `20261028000001_initial_schema.sql`:
   - Creates the 17 relational tables: `profiles`, `categories`, `posts`, `post_media`, `likes`, `comments`, `connections`, `conversations`, `conversation_participants`, `messages`, `jobs`, `job_applications`, `events`, `event_registrations`, `announcements`, `announcement_attachments`, `notifications`, `reports`, `platform_settings`.
   - Creates performance indexes and constraints.

2. `20261028000002_functions_triggers.sql`:
   - Creates `handle_updated_at()` trigger for automated timestamps.
   - Creates `handle_new_user()` trigger on `auth.users` to provision stub profile rows upon Google OAuth login.
   - Creates triggers for likes, comments, and connection notifications.
   - Declares `is_admin(user_id)` helper function.

3. `20261028000003_rls_policies.sql`:
   - Enables Row Level Security (RLS) on all 17 tables.
   - Configures policies ensuring users can only mutate owned records or data they are authorized to manage.

4. `20261028000004_seed_data.sql`:
   - Populates initial industry categories, system settings, and talukas.

---

## 3. Enable Realtime Replication

In the Supabase Dashboard:
1. Go to **Database > Replication**.
2. Enable replication for the `messages` table and `notifications` table.
3. This allows the frontend vanilla JavaScript client to listen to incoming chat messages and alerts in real-time.

---

## 4. Deploy Supabase Edge Functions

Install the Supabase CLI:
```bash
npm install -g supabase
```

Log in and link your project:
```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Set server-side secrets for AWS S3:
```bash
supabase secrets set AWS_REGION=ap-south-1
supabase secrets set AWS_S3_BUCKET_NAME=your-bucket-name
supabase secrets set AWS_ACCESS_KEY_ID=your-iam-access-key-id
supabase secrets set AWS_SECRET_ACCESS_KEY=your-iam-secret-access-key
```

Deploy the functions:
```bash
supabase functions deploy s3-presign --no-verify-jwt
supabase functions deploy s3-download --no-verify-jwt
```
*(JWT verification is performed directly inside the function handler code using `@supabase/supabase-js`).*

---

## 5. Provision the First Administrator

To promote a member to platform Administrator, run this in the **SQL Editor**:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-google-email@example.com';
```
*(Admins cannot be created via frontend inputs; this server-side command guarantees zero privilege escalation).*

# Dharashiv Foundation — Setup & Deployment Guide

This guide details the complete process for setting up the **Supabase** backend (Database, Google OAuth, Realtime, and Supabase Storage) and deploying the frontend to **Vercel**.

---

## Architecture Overview

* **Frontend:** Static HTML5, CSS3, and Vanilla JavaScript (ES Modules) hosted on **Vercel**.
* **Authentication:** Google OAuth managed by **Supabase Auth**.
* **Database:** **Supabase PostgreSQL** with Row-Level Security (RLS) policies.
* **Storage:** **Supabase Storage** with private and public buckets (`resumes`, `post-media`, `avatars`, `attachments`).
* **Realtime:** **Supabase Realtime** for direct messaging and alerts.

---

## 1. Supabase Backend Setup

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose:
   * **Name:** `Dharashiv-Foundation`
   * **Database Password:** Store this securely.
   * **Region:** Select `ap-south-1` (Mumbai) or the closest region to your users.
4. Once provisioned, navigate to **Project Settings > API** and copy:
   * **Project URL** (e.g., `https://xyzproject.supabase.co`)
   * **anon public key** (`eyJhbGciOi...`)

---

### Step 2: Database Schema & Migrations
Go to the **SQL Editor** in your Supabase Dashboard, create a new query, and run the following schema scripts in order:

#### 1. Tables & Schema
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    native_village TEXT,
    taluka TEXT CHECK (taluka IN ('Dharashiv', 'Tuljapur', 'Omerga', 'Paranda', 'Bhoom', 'Kalamb', 'Washi', 'Lohara', 'Other')),
    district TEXT NOT NULL DEFAULT 'Dharashiv',
    current_city TEXT,
    profession TEXT,
    company_name TEXT,
    business_category TEXT,
    business_type TEXT,
    business_description TEXT,
    services_offered TEXT,
    networking_interests TEXT[] DEFAULT '{}',
    website_url TEXT,
    linkedin_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Media
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Connections
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_connection CHECK (requester_id <> recipient_id),
    CONSTRAINT unique_connection_pair UNIQUE (requester_id, recipient_id)
);

-- Direct Messaging
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs & Applications
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    taluka TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Remote', 'Internship')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    applications_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_storage_path TEXT NOT NULL,
    resume_filename TEXT NOT NULL,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'accepted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_job_application UNIQUE (job_id, applicant_id)
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    taluka TEXT NOT NULL,
    category TEXT NOT NULL,
    capacity INT,
    attendees_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_registration UNIQUE (event_id, user_id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_official BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'member', 'job')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    action_taken TEXT,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2. Functions & Automatic Triggers
```sql
-- Profile provision trigger on Google sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, is_profile_completed)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        'member',
        true,
        false
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Like count trigger
CREATE OR REPLACE FUNCTION public.handle_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.handle_like_count();

-- Helper: Check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin' AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

#### 3. Row-Level Security (RLS)
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Publicly viewable, update own profile
CREATE POLICY "Profiles viewable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- Posts: All viewable, author inserts/updates
CREATE POLICY "Posts viewable" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors or admins delete posts" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

-- Connections: Participants can view and manage
CREATE POLICY "View connections" ON public.connections FOR SELECT TO authenticated USING (requester_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Insert connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Update connections" ON public.connections FOR UPDATE TO authenticated USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Messages: Participants can view and send
CREATE POLICY "View messages" ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Jobs: Active jobs viewable
CREATE POLICY "Jobs viewable" ON public.jobs FOR SELECT TO authenticated USING (status = 'active' OR poster_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Post jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (poster_id = auth.uid());

-- Job Applications: Applicant and employer can view
CREATE POLICY "View applications" ON public.job_applications FOR SELECT TO authenticated USING (
    applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.poster_id = auth.uid()) OR public.is_admin(auth.uid())
);
CREATE POLICY "Apply for job" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());

-- Notifications
CREATE POLICY "View notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid());
```

---

### Step 3: Configure Supabase Storage Buckets

1. In Supabase Dashboard, navigate to **Storage**.
2. Create the following 4 buckets:

| Bucket Name | Access | Purpose |
|---|---|---|
| **`post-media`** | **Public** | Image uploads for social feed posts |
| **`avatars`** | **Public** | User profile photos |
| **`attachments`** | **Public** | Announcement attachments |
| **`resumes`** | **Private** | Candidate resume documents (PDF, DOCX) |

3. In the **SQL Editor**, run the Storage RLS policies:

```sql
-- Allow authenticated users to upload to post-media
CREATE POLICY "Auth users upload post-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Public view post-media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'post-media');

-- Allow authenticated users to upload avatars
CREATE POLICY "Auth users upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow applicants to upload resumes
CREATE POLICY "Applicants upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Private access to resumes
CREATE POLICY "Authorized view resumes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes');
```

---

### Step 4: Configure Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-ref>.supabase.co/auth/v1/callback
   ```
4. Copy your **Client ID** and **Client Secret**.
5. In Supabase Dashboard, go to **Authentication > Providers > Google**:
   * Toggle **Enable Google provider** ON.
   * Paste the **Client ID** and **Client Secret**.
   * Click **Save**.

---

### Step 5: Enable Realtime
1. In Supabase Dashboard, go to **Database > Replication**.
2. Enable replication on the **`messages`** and **`notifications`** tables.

---

## 2. Vercel Frontend Deployment

### Step 1: Connect Frontend to Supabase
Open `js/config.js` and paste your live Supabase credentials:

```javascript
export const CONFIG = {
  SUPABASE_URL: 'https://<your-project-ref>.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here',
  // ...
};
```

### Step 2: Deploy to Vercel
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Update cloud credentials"
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Keep the default settings (**Framework Preset: Other**, **Root Directory: ./**).
5. Click **Deploy**.

Vercel will deploy the site in ~30 seconds and provide a production domain:
`https://your-project-name.vercel.app`

---

### Step 3: Whitelist Vercel Domain

1. **In Google Cloud Console:**
   * Go to **APIs & Services > Credentials** > Edit your OAuth 2.0 Web Client.
   * Under **Authorized JavaScript origins**, add your Vercel URL:
     ```
     https://your-project-name.vercel.app
     ```
   * Click **Save**.

2. **In Supabase Dashboard:**
   * Go to **Authentication > URL Configuration**.
   * Set **Site URL** to:
     ```
     https://your-project-name.vercel.app
     ```
   * Under **Redirect URLs**, add:
     ```
     https://your-project-name.vercel.app/auth-callback.html
     https://your-project-name.vercel.app/**
     ```
   * Click **Save**.

---

## 3. Promote Your Account to Admin

After signing in with Google for the first time, promote your profile to Administrator by running this query in Supabase **SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-google-email@example.com';
```

Refresh your browser to access the **Admin Portal** at `/admin/index.html`.

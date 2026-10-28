-- ==============================================================================
-- Dharashiv Foundation - Row Level Security (RLS) Policies
-- Migration: 20261028000003_rls_policies.sql
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (is_active = true OR id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (
    (id = auth.uid() AND (role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())))
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 2. Categories Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Categories viewable by all authenticated users"
ON public.categories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. Posts & Media Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Posts viewable by all authenticated users"
ON public.posts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors or admins can update posts"
ON public.posts FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Authors or admins can delete posts"
ON public.posts FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Post media viewable by all authenticated users"
ON public.post_media FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Post authors can insert post media"
ON public.post_media FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
);

CREATE POLICY "Post authors or admins can delete post media"
ON public.post_media FOR DELETE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR public.is_admin(auth.uid())))
);

-- ------------------------------------------------------------------------------
-- 4. Likes & Comments Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Likes viewable by all authenticated users"
ON public.likes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert own like"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own like"
ON public.likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Comments viewable by all authenticated users"
ON public.comments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
ON public.comments FOR UPDATE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Authors, post owners, or admins can delete comments"
ON public.comments FOR DELETE TO authenticated
USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin(auth.uid())
);

-- ------------------------------------------------------------------------------
-- 5. Connections Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view connections they are part of or admins"
ON public.connections FOR SELECT TO authenticated
USING (requester_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can send connection requests"
ON public.connections FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid() AND recipient_id <> auth.uid());

CREATE POLICY "Users can update connection status"
ON public.connections FOR UPDATE TO authenticated
USING (requester_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their connections"
ON public.connections FOR DELETE TO authenticated
USING (requester_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. Direct Messaging Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users view conversations they participate in"
ON public.conversations FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users view participants in their conversations"
ON public.conversation_participants FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can insert conversation participants"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users view messages in their conversations"
ON public.messages FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Users send messages to their conversations"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- 7. Jobs & Job Applications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Jobs viewable by authenticated users"
ON public.jobs FOR SELECT TO authenticated
USING (status = 'active' OR poster_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can post jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (poster_id = auth.uid());

CREATE POLICY "Posters or admins can update jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (poster_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (poster_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Posters or admins can delete jobs"
ON public.jobs FOR DELETE TO authenticated
USING (poster_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Job applications viewable by applicant, job poster, or admin"
ON public.job_applications FOR SELECT TO authenticated
USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.poster_id = auth.uid())
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can apply for jobs"
ON public.job_applications FOR INSERT TO authenticated
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Job posters or admins can update application status"
ON public.job_applications FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.poster_id = auth.uid())
    OR public.is_admin(auth.uid())
);

-- ------------------------------------------------------------------------------
-- 8. Events & Event Registrations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Events viewable by all authenticated users"
ON public.events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins or organizers can manage events"
ON public.events FOR ALL TO authenticated
USING (organizer_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Event registrations viewable by registrant, organizer, or admin"
ON public.event_registrations FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can register for events"
ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their event registration"
ON public.event_registrations FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 9. Announcements Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Approved announcements viewable by all; pending by author or admin"
ON public.announcements FOR SELECT TO authenticated
USING (status = 'approved' OR author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can submit announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors or admins can update announcements"
ON public.announcements FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Authors or admins can delete announcements"
ON public.announcements FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 10. Notifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications (mark read)"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (recipient_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 11. Reports & Platform Settings Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Reports viewable by reporter or admin"
ON public.reports FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Platform settings viewable by authenticated users"
ON public.platform_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can modify platform settings"
ON public.platform_settings FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

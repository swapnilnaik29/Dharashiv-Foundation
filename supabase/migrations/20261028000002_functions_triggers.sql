-- ==============================================================================
-- Dharashiv Foundation - Database Functions & Triggers
-- Migration: 20261028000002_functions_triggers.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automatic updated_at Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at to all tables with the column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Auth Hook: Automatically create profile on Google Sign-in
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_avatar TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    user_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        ''
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        is_active,
        is_profile_completed
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_avatar,
        'member',
        true,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Likes Counter Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        
        -- Create notification for post author if not liking own post
        INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
        SELECT p.author_id, NEW.user_id, 'post_like', 'New Like on your post',
               'Someone liked your post in the community feed.', '/feed.html?post=' || NEW.post_id
        FROM public.posts p
        WHERE p.id = NEW.post_id AND p.author_id <> NEW.user_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
CREATE TRIGGER trg_likes_count
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_like_count();

-- ------------------------------------------------------------------------------
-- 4. Comments Counter & Notification Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;

        -- Create notification for post author
        INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
        SELECT p.author_id, NEW.author_id, 'post_comment', 'New Comment on your post',
               'A member commented on your post: "' || substring(NEW.content from 1 for 40) || '..."', '/feed.html?post=' || NEW.post_id
        FROM public.posts p
        WHERE p.id = NEW.post_id AND p.author_id <> NEW.author_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comments_count ON public.comments;
CREATE TRIGGER trg_comments_count
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- ------------------------------------------------------------------------------
-- 5. Connection Requests Notification Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_connection_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.requester_id;

    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
        VALUES (
            NEW.recipient_id,
            NEW.requester_id,
            'connection_request',
            'New Connection Request',
            COALESCE(sender_name, 'A member') || ' sent you a networking connection request.',
            '/connections.html'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
        SELECT
            NEW.requester_id,
            NEW.recipient_id,
            'connection_accepted',
            'Connection Request Accepted',
            pr.full_name || ' accepted your connection request. You can now chat directly!',
            '/messages.html?with=' || NEW.recipient_id
        FROM public.profiles pr
        WHERE pr.id = NEW.recipient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_connection_notification ON public.connections;
CREATE TRIGGER trg_connection_notification
    AFTER INSERT OR UPDATE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.handle_connection_notification();

-- ------------------------------------------------------------------------------
-- 6. Helper: Check if user is an Administrator
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id
          AND role = 'admin'
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

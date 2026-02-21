-- ============================================================
-- JARA DAILY — PRODUCTION MIGRATION 003
-- Posts, Comments, Notifications, Storage buckets
-- ============================================================

-- Posts table (real content, replacing mockData)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  category post_category NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  media_type TEXT NOT NULL DEFAULT 'text' CHECK (media_type IN ('text','video','audio')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  reactions_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  read_time INTEGER NOT NULL DEFAULT 3,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON public.posts FOR SELECT USING (published = true);
CREATE POLICY "Authors can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_posts_views ON public.posts(views DESC);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slug generator function
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := left(base_slug, 60);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX idx_comments_post ON public.comments(post_id, created_at DESC);

-- Post reactions table (prevents duplicate reactions per user per post)
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON public.post_reactions FOR ALL USING (auth.uid() = user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('xp','streak','social','system','coin','mission')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  xp_amount INTEGER,
  coin_amount INTEGER,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Post view increment (rate-limited per user per post per day)
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Rate limit: one view increment per user (or IP bucket) per post per day
  IF p_user_id IS NOT NULL THEN
    v_key := p_user_id::text || '_view_' || p_post_id::text || '_' || CURRENT_DATE::text;
    IF EXISTS (SELECT 1 FROM coin_ledger WHERE idempotency_key = v_key) THEN
      RETURN; -- already counted today
    END IF;
    INSERT INTO coin_ledger (user_id, source_type, amount, post_id, idempotency_key)
    VALUES (p_user_id, 'read', 0, p_post_id::text, v_key)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  UPDATE posts SET views = views + 1 WHERE id = p_post_id;
END;
$$;

-- Add comment and update comment_count atomically
CREATE OR REPLACE FUNCTION public.add_comment(
  p_post_id UUID,
  p_author_id UUID,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  INSERT INTO comments (post_id, author_id, content)
  VALUES (p_post_id, p_author_id, p_content)
  RETURNING id INTO v_comment_id;

  UPDATE posts SET comments_count = comments_count + 1 WHERE id = p_post_id;

  -- Notify post author
  INSERT INTO notifications (user_id, type, title, description)
  SELECT
    p.author_id,
    'social',
    'New comment on your post',
    'Someone commented: ' || left(p_content, 80)
  FROM posts p
  WHERE p.id = p_post_id AND p.author_id != p_author_id;

  RETURN v_comment_id;
END;
$$;

-- React to post (upsert reaction, update count)
CREATE OR REPLACE FUNCTION public.react_to_post(
  p_post_id UUID,
  p_user_id UUID,
  p_emoji TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existed boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_reactions WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_existed;

  IF v_existed THEN
    -- Toggle off if same emoji, swap if different
    DELETE FROM post_reactions WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE posts SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO post_reactions (post_id, user_id, emoji) VALUES (p_post_id, p_user_id, p_emoji);
    UPDATE posts SET reactions_count = reactions_count + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$;

-- Update streak on login
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_login DATE;
  v_streak INTEGER;
BEGIN
  SELECT last_login_date, streak_days INTO v_last_login, v_streak
  FROM profiles WHERE id = p_user_id;

  IF v_last_login IS NULL OR v_last_login < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken or first login
    v_streak := 1;
  ELSIF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_streak := v_streak + 1;
  ELSE
    -- Already logged in today, no change
    RETURN v_streak;
  END IF;

  UPDATE profiles
  SET streak_days = v_streak, last_login_date = CURRENT_DATE, updated_at = now()
  WHERE id = p_user_id;

  -- Notify on milestone streaks
  IF v_streak IN (3, 7, 14, 30, 60, 100) THEN
    INSERT INTO notifications (user_id, type, title, description)
    VALUES (p_user_id, 'streak', '🔥 ' || v_streak || ' Day Streak!', 'Incredible consistency! Keep it up.');
  END IF;

  RETURN v_streak;
END;
$$;

-- Create notification helper
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_xp_amount INTEGER DEFAULT NULL,
  p_coin_amount INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, description, xp_amount, coin_amount)
  VALUES (p_user_id, p_type, p_title, p_description, p_xp_amount, p_coin_amount)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Mark all notifications read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications SET read = true WHERE user_id = p_user_id AND read = false;
END;
$$;

-- Storage buckets (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage policies (uncomment and run in Supabase SQL editor)
-- CREATE POLICY "Anyone can view post images" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
-- CREATE POLICY "Auth users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Auth users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

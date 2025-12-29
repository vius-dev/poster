-- Migration: 20231227000021_structural_integrity_upgrade.sql
-- Goal: Consolidated upgrade of RLS, Constraints, and Social Logic

-- 1. ENHANCE POSTS TABLE STRUCTURE
-- Add support for explicit reposts and replies
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS reposted_post_id uuid REFERENCES public.posts(id),
ADD COLUMN IF NOT EXISTS repost_json jsonb; -- For future-proofing metadata

-- Update type constraint to include 'reply'
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_type_check;

ALTER TABLE public.posts
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('original', 'repost', 'quote', 'reply'));

-- Add structural integrity constraints
ALTER TABLE public.posts
ADD CONSTRAINT valid_quote CHECK (type != 'quote' or quoted_post_id is not null),
ADD CONSTRAINT valid_repost CHECK (type != 'repost' or reposted_post_id is not null),
ADD CONSTRAINT valid_reply CHECK (type != 'reply' or parent_id is not null);

-- 2. ADVANCED PRIVACY HELPER
-- Implements block-aware and visibility-aware access control
CREATE OR REPLACE FUNCTION public.can_see_post(p_post_id uuid, p_viewer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_post_record record;
BEGIN
    -- Get the post (respecting soft delete)
    SELECT id, owner_id, visibility, type, parent_id, quoted_post_id, reposted_post_id 
    INTO v_post_record 
    FROM public.posts 
    WHERE id = p_post_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- SYSTEM/ADMIN BYPASS (auth.uid() is null for anonymous web view if not allowed)
    IF p_viewer_id IS NULL AND v_post_record.visibility = 'public' THEN
        RETURN TRUE;
    END IF;

    -- BIDIRECTIONAL BLOCKS
    IF EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = v_post_record.owner_id AND blocked_id = p_viewer_id)
           OR (blocker_id = p_viewer_id AND blocked_id = v_post_record.owner_id)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- OWNERSHIP
    IF v_post_record.owner_id = p_viewer_id THEN
        RETURN TRUE;
    END IF;
    
    -- VISIBILITY RULES
    IF v_post_record.visibility = 'public' THEN
        RETURN TRUE;
    ELSIF v_post_record.visibility = 'followers' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = p_viewer_id AND following_id = v_post_record.owner_id
        );
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 3. UPGRADE POST RLS POLICIES
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Posts are viewable by everyone unless deleted or private" ON public.posts;
DROP POLICY IF EXISTS "Original posts are viewable based on visibility and blocks" ON public.posts;
DROP POLICY IF EXISTS "Quote posts are viewable if both quote and quoted are visible" ON public.posts;
DROP POLICY IF EXISTS "Reposts are viewable if original post is visible" ON public.posts;
DROP POLICY IF EXISTS "Replies are viewable if parent post is visible" ON public.posts;

-- Consolidated Selection Policy
CREATE POLICY "Users can selectively view posts"
    ON public.posts FOR SELECT
    USING (
        deleted_at IS NULL AND (
            (type = 'original' AND public.can_see_post(id, auth.uid())) OR
            (type = 'quote' AND public.can_see_post(id, auth.uid()) AND public.can_see_post(quoted_post_id, auth.uid())) OR
            (type = 'repost' AND public.can_see_post(id, auth.uid()) AND public.can_see_post(reposted_post_id, auth.uid())) OR
            (type = 'reply' AND public.can_see_post(id, auth.uid()) AND public.can_see_post(parent_id, auth.uid()))
        )
    );

-- 4. SMART AGGREGATE TRIGGERS
-- Upgrade triggers to handle nested counts and reaction changes

-- A. Update Comment Counts (Recursive Root Sync)
CREATE OR REPLACE FUNCTION public.update_comment_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_root_post_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.type = 'reply') THEN
    v_root_post_id := NEW.parent_id;
    -- Traverse to root
    WHILE EXISTS (SELECT 1 FROM public.posts WHERE id = v_root_post_id AND type = 'reply') LOOP
      SELECT parent_id INTO v_root_post_id FROM public.posts WHERE id = v_root_post_id;
    END LOOP;

    INSERT INTO public.reaction_aggregates (subject_id)
    VALUES (v_root_post_id)
    ON CONFLICT (subject_id) DO NOTHING;

    UPDATE public.reaction_aggregates 
    SET comment_count = comment_count + 1, updated_at = now() 
    WHERE subject_id = v_root_post_id;
    
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'reply') THEN
    v_root_post_id := OLD.parent_id;
    WHILE EXISTS (SELECT 1 FROM public.posts WHERE id = v_root_post_id AND type = 'reply') LOOP
      SELECT parent_id INTO v_root_post_id FROM public.posts WHERE id = v_root_post_id;
    END LOOP;

    UPDATE public.reaction_aggregates 
    SET comment_count = greatest(comment_count - 1, 0), updated_at = now() 
    WHERE subject_id = v_root_post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_reply_change ON public.posts;
CREATE TRIGGER on_reply_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE PROCEDURE public.update_comment_counts();

-- B. Update Repost Counts
CREATE OR REPLACE FUNCTION public.update_repost_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.type = 'repost') THEN
    INSERT INTO public.reaction_aggregates (subject_id)
    VALUES (NEW.reposted_post_id)
    ON CONFLICT (subject_id) DO NOTHING;
    
    UPDATE public.reaction_aggregates 
    SET repost_count = repost_count + 1, updated_at = now() 
    WHERE subject_id = NEW.reposted_post_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'repost') THEN
    UPDATE public.reaction_aggregates 
    SET repost_count = greatest(repost_count - 1, 0), updated_at = now() 
    WHERE subject_id = OLD.reposted_post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_repost_change ON public.posts;
CREATE TRIGGER on_repost_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE PROCEDURE public.update_repost_counts();

-- 5. PERFORMANCE INDICES for New Architecture
CREATE INDEX IF NOT EXISTS idx_posts_reposted_post_id ON public.posts(reposted_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_type_visibility ON public.posts(type, visibility) WHERE deleted_at IS NULL;

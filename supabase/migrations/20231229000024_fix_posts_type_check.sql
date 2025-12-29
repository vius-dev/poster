-- Fix posts_type_check constraint to include 'poll' and 'reply'

-- 1. Drop existing constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;

-- 2. Add updated constraint
ALTER TABLE public.posts 
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('original', 'repost', 'quote', 'reply', 'poll'));

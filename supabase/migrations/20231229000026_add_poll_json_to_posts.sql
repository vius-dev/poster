-- Add poll_json column to posts table
-- Required for poll creation and the populate_poll_from_json trigger

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS poll_json JSONB;

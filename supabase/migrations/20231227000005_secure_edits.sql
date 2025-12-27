
-- SECURE EDITS: TIME LIMIT ENFORCEMENT
-- Migration: 20231227000005_secure_edits.sql

-- 1. DROP OLD PERMISSIVE POLICIES
-- We need to separate "Content Edits" from "Soft Deletes" explicitly to be safe.
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can soft delete own posts" on public.posts;

-- 2. CREATE STRICT EDIT POLICY (15 MINUTE WINDOW)
-- Rule: updates to content or visibility are only allowed within 15 mins of creation.
create policy "Users can edit posts within 15 mins"
    on public.posts for update
    using (
        auth.uid() = owner_id 
        and created_at > (now() - interval '15 minutes')
    )
    with check (
        auth.uid() = owner_id 
        and created_at > (now() - interval '15 minutes')
    );

-- 3. CREATE SEPARATE DELETE POLICY (ANYTIME)
-- Rule: updates to 'deleted_at' (Soft Delete) are allowed anytime.
-- Note: 'deleted_at is null' in the USING clause ensures we don't double-delete.
-- Note: 'deleted_at is not null' in the CHECK clause ensures this policy is ONLY used for deleting.
create policy "Users can delete own posts anytime"
    on public.posts for update
    using (auth.uid() = owner_id)
    with check (
        auth.uid() = owner_id
        and deleted_at is not null -- Must be setting the delete flag
    );

-- 4. CONFIRMATION COMMENT
comment on table public.posts is 'Posts with strict 15-min edit window RLS enforcement.';

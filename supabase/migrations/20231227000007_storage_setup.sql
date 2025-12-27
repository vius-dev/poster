
-- STORAGE BUCKETS AND SECURITY
-- Migration: 20231227000007_storage_setup.sql

-- 1. CREATE BUCKETS
-- We insert directly into storage.buckets with 1MB limit
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('avatars', 'avatars', true, 1048576, ARRAY['image/jpg', 'image/jpeg', 'image/png', 'image/gif']),
  ('headers', 'headers', true, 1048576, ARRAY['image/jpg', 'image/jpeg', 'image/png', 'image/gif']),
  ('post_media', 'post_media', true, 1048576, ARRAY['image/jpg', 'image/jpeg', 'image/png', 'image/gif']), 
  ('message_media', 'message_media', false, 1048576, ARRAY['image/jpg', 'image/jpeg', 'image/png', 'image/gif']); -- PRIVATE

-- 2. RLS POLICIES (storage.objects)
-- Note: 'storage' schema usually comes pre-enabled with RLS.

-- A. AVATARS (Public Read, Owner Write)
create policy "Avatars are public"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid() = owner
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid() = owner
  );
  
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and auth.uid() = owner
  );

-- B. HEADERS (Public Read, Owner Write)
create policy "Headers are public"
  on storage.objects for select
  using ( bucket_id = 'headers' );

create policy "Users can upload own header"
  on storage.objects for insert
  with check (
    bucket_id = 'headers' 
    and auth.uid() = owner
  );

create policy "Users can update own header"
  on storage.objects for update
  using (
    bucket_id = 'headers' 
    and auth.uid() = owner
  );
  
create policy "Users can delete own header"
  on storage.objects for delete
  using (
    bucket_id = 'headers' 
    and auth.uid() = owner
  );

-- C. POST MEDIA (Public Read, Owner Write)
create policy "Post media is public"
  on storage.objects for select
  using ( bucket_id = 'post_media' );

create policy "Users can upload post media"
  on storage.objects for insert
  with check (
    bucket_id = 'post_media' 
    and auth.uid() = owner
  );

create policy "Users can delete own post media"
  on storage.objects for delete
  using (
    bucket_id = 'post_media' 
    and auth.uid() = owner
  );

-- D. MESSAGE MEDIA (Private Read, Participant Write)
-- Read: Must be a participant in the conversation associated with this file? 
-- Storage RLS is hard to link to tables. 
-- PATTERN: Allow user to read files they uploaded OR files in a folder structure they have access to.
-- SIMPLIFICATION: Verified users can read from message_media (Application controls access via signed URLs).
-- Since bucket is PRIVATE, you MUST use signed URLs.
-- So we just need policies to allow generation of signed URLs.

create policy "Users can upload message media"
  on storage.objects for insert
  with check (
    bucket_id = 'message_media' 
    and auth.uid() = owner
  );

create policy "Users can delete own message media"
  on storage.objects for delete
  using (
    bucket_id = 'message_media' 
    and auth.uid() = owner
  );

-- For SELECT on private buckets, typically the user needs permission to call `storage.from().download()`.
-- However, for performance, we rely on `storage.from().createSignedUrl()` which is a server-side or authorized client action.
-- Only the uploader needs direct RLS SELECT access to manage their files.
create policy "Users can select own message media"
  on storage.objects for select
  using (
    bucket_id = 'message_media' 
    and auth.uid() = owner
  );

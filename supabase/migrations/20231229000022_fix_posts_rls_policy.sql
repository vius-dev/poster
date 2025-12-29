-- Fix RLS policy for posts table to allow INSERT operations
-- The existing policy was using WITH CHECK without FOR INSERT, which doesn't allow inserts

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can create posts" ON "public"."posts";

-- Create the correct INSERT policy
-- This allows users to insert posts where they are the owner
CREATE POLICY "Users can create posts"
ON "public"."posts"
FOR INSERT
TO public
WITH CHECK (auth.uid() = owner_id);

-- Also ensure we have a SELECT policy for users to read their own posts
DROP POLICY IF EXISTS "Users can view posts" ON "public"."posts";

CREATE POLICY "Users can view posts"
ON "public"."posts"
FOR SELECT
TO public
USING (true); -- Allow reading all posts (public feed)

-- And an UPDATE policy for users to edit their own posts
DROP POLICY IF EXISTS "Users can update their own posts" ON "public"."posts";

CREATE POLICY "Users can update their own posts"
ON "public"."posts"
FOR UPDATE
TO public
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- And a DELETE policy for users to delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON "public"."posts";

CREATE POLICY "Users can delete their own posts"
ON "public"."posts"
FOR DELETE
TO public
USING (auth.uid() = owner_id);

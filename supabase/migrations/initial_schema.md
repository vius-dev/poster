-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. SCHEMAS
create schema if not exists private;

-- 3. CORE IDENTITY (profiles)
-- Matches api.ts: User
create table public.profiles (
    id uuid references auth.users on delete cascade primary key, -- owner_id is implicit
    username text unique not null,
    name text not null,
    avatar text,
    header_image text,
    bio text,
    location text,
    website text,
    is_active boolean default true,
    is_suspended boolean default false,
    is_limited boolean default false,
    is_shadow_banned boolean default false,
    is_verified boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    constraint username_length check (char_length(username) >= 3)
);

-- RLS: Profiles (Ownership-First)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (
        not exists (
            select 1 from public.blocks
            where (blocker_id = id and blocked_id = auth.uid())
               or (blocker_id = auth.uid() and blocked_id = id)
        )
    );

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- 4. CONTENT CORE (posts)
-- Matches api.ts: Post (minus stats/media)
-- Rule: Posts do not know about reactions or comments.
create type public.post_visibility as enum ('public', 'followers', 'private');

create table public.posts (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    content text,
    type text check (type in ('original', 'repost', 'quote', 'reply')) default 'original',
    parent_id uuid references public.posts(id), -- For threading (replies)
    quoted_post_id uuid references public.posts(id), -- For quotes
    reposted_post_id uuid references public.posts(id), -- For reposts
    visibility public.post_visibility default 'public',
    is_pinned boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz, -- Soft delete
    
    constraint valid_quote check (type != 'quote' or quoted_post_id is not null),
    constraint valid_repost check (type != 'repost' or reposted_post_id is not null),
    constraint valid_reply check (type != 'reply' or parent_id is not null)
);

-- RLS: Posts (Ownership-First + Soft Delete + Blocks)
alter table public.posts enable row level security;

-- Helper function: Check if viewer can see a specific post
create or replace function public.can_see_post(post_id uuid, viewer_id uuid)
returns boolean as $$
declare
    post_record record;
begin
    -- Get the post
    select * into post_record from public.posts where id = post_id and deleted_at is null;
    
    -- Post doesn't exist or is deleted
    if not found then
        return false;
    end if;
    
    -- Check blocks (bidirectional)
    if exists (
        select 1 from public.blocks
        where (blocker_id = post_record.owner_id and blocked_id = viewer_id)
           or (blocker_id = viewer_id and blocked_id = post_record.owner_id)
    ) then
        return false;
    end if;
    
    -- Owner can always see their own posts
    if post_record.owner_id = viewer_id then
        return true;
    end if;
    
    -- Check visibility
    if post_record.visibility = 'public' then
        return true;
    elsif post_record.visibility = 'followers' then
        return exists (
            select 1 from public.follows
            where follower_id = viewer_id and following_id = post_record.owner_id
        );
    elsif post_record.visibility = 'private' then
        return false;
    end if;
    
    return false;
end;
$$ language plpgsql security definer stable;

-- Policy: Original posts
create policy "Original posts are viewable based on visibility and blocks"
    on public.posts for select
    using (
        type = 'original' and
        deleted_at is null and
        can_see_post(id, auth.uid())
    );

-- Policy: Quote posts (constrained by quoted post visibility)
create policy "Quote posts are viewable if both quote and quoted are visible"
    on public.posts for select
    using (
        type = 'quote' and
        deleted_at is null and
        can_see_post(id, auth.uid()) and
        can_see_post(quoted_post_id, auth.uid())
    );

-- Policy: Reposts (inherit visibility of reposted post)
create policy "Reposts are viewable if original post is visible"
    on public.posts for select
    using (
        type = 'repost' and
        deleted_at is null and
        can_see_post(reposted_post_id, auth.uid())
    );

-- Policy: Replies (constrained by parent post visibility)
create policy "Replies are viewable if parent post is visible"
    on public.posts for select
    using (
        type = 'reply' and
        deleted_at is null and
        can_see_post(id, auth.uid()) and
        can_see_post(parent_id, auth.uid())
    );

create policy "Users can create posts"
    on public.posts for insert
    with check (auth.uid() = owner_id);

create policy "Users can update own posts"
    on public.posts for update
    using (auth.uid() = owner_id);

create policy "Users can soft delete own posts"
    on public.posts for update
    using (auth.uid() = owner_id)
    with check (deleted_at is not null);

-- 5. CONTENT MEDIA (post_media)
-- Separated from posts table
create table public.post_media (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    url text not null,
    type text check (type in ('image', 'video')) not null,
    aspect_ratio float,
    order_index int default 0,
    created_at timestamptz default now()
);

alter table public.post_media enable row level security;

create policy "Media viewable via post access"
    on public.post_media for select
    using (
        exists (
            select 1 from public.posts 
            where id = post_media.post_id 
            and can_see_post(id, auth.uid())
        )
    );

create policy "Users can add media to own posts"
    on public.post_media for insert
    with check (
        exists (
            select 1 from public.posts 
            where id = post_media.post_id and owner_id = auth.uid()
        )
    );

-- 6. INTERACTION MODULE: REACTIONS (post_reactions)
-- Matches api.ts: reactionsMap
-- Rule: Actor-Subject Pattern
create table public.post_reactions (
    id uuid default gen_random_uuid() primary key,
    actor_id uuid references public.profiles(id) on delete cascade not null, -- Who
    subject_id uuid references public.posts(id) on delete cascade not null, -- What
    type text check (type in ('LIKE', 'DISLIKE', 'LAUGH')) not null,
    created_at timestamptz default now(),
    
    unique(actor_id, subject_id) -- One reaction per user per post
);

alter table public.post_reactions enable row level security;

create policy "Reactions are viewable by everyone except blocked users"
    on public.post_reactions for select
    using (
        not exists (
            select 1 from public.blocks
            where (blocker_id = actor_id and blocked_id = auth.uid())
               or (blocker_id = auth.uid() and blocked_id = actor_id)
        )
    );

create policy "Users can react as themselves"
    on public.post_reactions for insert
    with check (auth.uid() = actor_id);

create policy "Users can remove their own reactions"
    on public.post_reactions for delete
    using (auth.uid() = actor_id);

create policy "Users can update their own reactions"
    on public.post_reactions for update
    using (auth.uid() = actor_id)
    with check (auth.uid() = actor_id);

-- 7. READ-HEAVY AGGREGATES (reaction_aggregates)
-- Read Public, Write Private Pattern
create table public.reaction_aggregates (
    subject_id uuid references public.posts(id) on delete cascade primary key,
    like_count int default 0,
    dislike_count int default 0,
    laugh_count int default 0,
    repost_count int default 0,
    comment_count int default 0,
    updated_at timestamptz default now()
);

alter table public.reaction_aggregates enable row level security;

create policy "Aggregates are public"
    on public.reaction_aggregates for select
    using (true);

-- No insert/update policy for clients -> Edge Functions/Triggers only.

-- 8. RELATIONSHIP MODULE (follows)
create table public.follows (
    follower_id uuid references public.profiles(id) on delete cascade not null,
    following_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    
    primary key (follower_id, following_id),
    check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Follows viewable by everyone except blocked users"
    on public.follows for select
    using (
        not exists (
            select 1 from public.blocks
            where (blocker_id = follower_id and blocked_id = auth.uid())
               or (blocker_id = auth.uid() and blocked_id = follower_id)
               or (blocker_id = following_id and blocked_id = auth.uid())
               or (blocker_id = auth.uid() and blocked_id = following_id)
        )
    );

create policy "Users can follow others"
    on public.follows for insert
    with check (
        auth.uid() = follower_id and
        not exists (
            select 1 from public.blocks
            where (blocker_id = follower_id and blocked_id = following_id)
               or (blocker_id = following_id and blocked_id = follower_id)
        )
    );

create policy "Users can unfollow"
    on public.follows for delete
    using (auth.uid() = follower_id);

-- 9. NEGATIVE ACCESS (blocks)
-- Centralized block logic
create table public.blocks (
    blocker_id uuid references public.profiles(id) on delete cascade not null,
    blocked_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    
    primary key (blocker_id, blocked_id),
    check (blocker_id != blocked_id) -- Prevent self-blocking
);

alter table public.blocks enable row level security;

create policy "Users can see their own blocks"
    on public.blocks for select
    using (auth.uid() = blocker_id);

create policy "Users can block others"
    on public.blocks for insert
    with check (auth.uid() = blocker_id);

create policy "Users can unblock"
    on public.blocks for delete
    using (auth.uid() = blocker_id);

-- 10. TRIGGER: Auto-Provision Profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'https://i.pravatar.cc/150?u=' || new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. TRIGGER: Update Reaction Aggregates (Complete Implementation)
create or replace function public.update_reaction_counts()
returns trigger as $$
begin
  -- Ensure aggregate row exists
  insert into public.reaction_aggregates (subject_id)
  values (coalesce(new.subject_id, old.subject_id))
  on conflict (subject_id) do nothing;

  if (TG_OP = 'INSERT') then
    if (new.type = 'LIKE') then
        update public.reaction_aggregates 
        set like_count = like_count + 1, updated_at = now() 
        where subject_id = new.subject_id;
    elsif (new.type = 'DISLIKE') then
        update public.reaction_aggregates 
        set dislike_count = dislike_count + 1, updated_at = now() 
        where subject_id = new.subject_id;
    elsif (new.type = 'LAUGH') then
        update public.reaction_aggregates 
        set laugh_count = laugh_count + 1, updated_at = now() 
        where subject_id = new.subject_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (old.type = 'LIKE') then
        update public.reaction_aggregates 
        set like_count = greatest(like_count - 1, 0), updated_at = now() 
        where subject_id = old.subject_id;
    elsif (old.type = 'DISLIKE') then
        update public.reaction_aggregates 
        set dislike_count = greatest(dislike_count - 1, 0), updated_at = now() 
        where subject_id = old.subject_id;
    elsif (old.type = 'LAUGH') then
        update public.reaction_aggregates 
        set laugh_count = greatest(laugh_count - 1, 0), updated_at = now() 
        where subject_id = old.subject_id;
    end if;
  elsif (TG_OP = 'UPDATE') then
    -- Handle reaction type change
    if (old.type != new.type) then
      -- Decrement old type
      if (old.type = 'LIKE') then
          update public.reaction_aggregates 
          set like_count = greatest(like_count - 1, 0), updated_at = now() 
          where subject_id = old.subject_id;
      elsif (old.type = 'DISLIKE') then
          update public.reaction_aggregates 
          set dislike_count = greatest(dislike_count - 1, 0), updated_at = now() 
          where subject_id = old.subject_id;
      elsif (old.type = 'LAUGH') then
          update public.reaction_aggregates 
          set laugh_count = greatest(laugh_count - 1, 0), updated_at = now() 
          where subject_id = old.subject_id;
      end if;
      
      -- Increment new type
      if (new.type = 'LIKE') then
          update public.reaction_aggregates 
          set like_count = like_count + 1, updated_at = now() 
          where subject_id = new.subject_id;
      elsif (new.type = 'DISLIKE') then
          update public.reaction_aggregates 
          set dislike_count = dislike_count + 1, updated_at = now() 
          where subject_id = new.subject_id;
      elsif (new.type = 'LAUGH') then
          update public.reaction_aggregates 
          set laugh_count = laugh_count + 1, updated_at = now() 
          where subject_id = new.subject_id;
      end if;
    end if;
  end if;
  
  return null;
end;
$$ language plpgsql security definer;

create trigger on_reaction_change
  after insert or delete or update on public.post_reactions
  for each row execute procedure public.update_reaction_counts();

-- 12. TRIGGER: Update Repost Counts
create or replace function public.update_repost_counts()
returns trigger as $$
begin
  -- Ensure aggregate row exists for the reposted post
  if (TG_OP = 'INSERT' and new.type = 'repost') then
    insert into public.reaction_aggregates (subject_id)
    values (new.reposted_post_id)
    on conflict (subject_id) do nothing;
    
    update public.reaction_aggregates 
    set repost_count = repost_count + 1, updated_at = now() 
    where subject_id = new.reposted_post_id;
  elsif (TG_OP = 'DELETE' and old.type = 'repost') then
    update public.reaction_aggregates 
    set repost_count = greatest(repost_count - 1, 0), updated_at = now() 
    where subject_id = old.reposted_post_id;
  end if;
  
  return null;
end;
$$ language plpgsql security definer;

create trigger on_repost_change
  after insert or delete on public.posts
  for each row execute procedure public.update_repost_counts();

-- 13. TRIGGER: Update Comment Counts
create or replace function public.update_comment_counts()
returns trigger as $$
declare
  root_post_id uuid;
begin
  -- For replies, find the root post (traverse up the tree if nested)
  if (TG_OP = 'INSERT' and new.type = 'reply') then
    root_post_id := new.parent_id;
    
    -- Traverse to find root (in case of nested replies)
    while exists (select 1 from public.posts where id = root_post_id and type = 'reply') loop
      select parent_id into root_post_id from public.posts where id = root_post_id;
    end loop;
    
    -- Ensure aggregate row exists
    insert into public.reaction_aggregates (subject_id)
    values (root_post_id)
    on conflict (subject_id) do nothing;
    
    update public.reaction_aggregates 
    set comment_count = comment_count + 1, updated_at = now() 
    where subject_id = root_post_id;
    
  elsif (TG_OP = 'DELETE' and old.type = 'reply') then
    root_post_id := old.parent_id;
    
    -- Traverse to find root
    while exists (select 1 from public.posts where id = root_post_id and type = 'reply') loop
      select parent_id into root_post_id from public.posts where id = root_post_id;
    end loop;
    
    update public.reaction_aggregates 
    set comment_count = greatest(comment_count - 1, 0), updated_at = now() 
    where subject_id = root_post_id;
  end if;
  
  return null;
end;
$$ language plpgsql security definer;

create trigger on_reply_change
  after insert or delete on public.posts
  for each row execute procedure public.update_comment_counts();

-- 14. INDEXES for Performance
create index idx_posts_owner_id on public.posts(owner_id);
create index idx_posts_type on public.posts(type);
create index idx_posts_parent_id on public.posts(parent_id);
create index idx_posts_quoted_post_id on public.posts(quoted_post_id);
create index idx_posts_reposted_post_id on public.posts(reposted_post_id);
create index idx_posts_deleted_at on public.posts(deleted_at);
create index idx_posts_created_at on public.posts(created_at desc);

create index idx_post_media_post_id on public.post_media(post_id);

create index idx_post_reactions_actor_id on public.post_reactions(actor_id);
create index idx_post_reactions_subject_id on public.post_reactions(subject_id);

create index idx_follows_follower_id on public.follows(follower_id);
create index idx_follows_following_id on public.follows(following_id);

create index idx_blocks_blocker_id on public.blocks(blocker_id);
create index idx_blocks_blocked_id on public.blocks(blocked_id);
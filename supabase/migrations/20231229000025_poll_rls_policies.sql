-- RLS Policies for Polls

-- 1. Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- 2. Polls Viewable by Everyone
DROP POLICY IF EXISTS "Polls viewable by everyone" ON public.polls;
CREATE POLICY "Polls viewable by everyone"
    ON public.polls FOR SELECT
    USING (true);

-- 3. Options Viewable by Everyone
DROP POLICY IF EXISTS "Options viewable by everyone" ON public.poll_options;
CREATE POLICY "Options viewable by everyone"
    ON public.poll_options FOR SELECT
    USING (true);

-- 4. Votes Viewable by Everyone (Results are public)
DROP POLICY IF EXISTS "Users can see their own votes (or public if desired)" ON public.poll_votes;
CREATE POLICY "Votes viewable by everyone" 
    ON public.poll_votes FOR SELECT
    USING (true);

-- 5. Voting Permission (Insert own votes)
DROP POLICY IF EXISTS "Users can vote once" ON public.poll_votes;
CREATE POLICY "Users can vote once"
    ON public.poll_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Trigger-based entries (polls/options) usually run as postgres/definer,
-- but if inserted via client (which they shouldn't be, they are via trigger), 
-- we can skip INSERT/UPDATE policies for polls/options for now or lock them down.
-- But since populate_poll_from_json matches posts which ARE user-owned, it's fine.
-- The trigger executes as security definer, so it bypasses RLS.

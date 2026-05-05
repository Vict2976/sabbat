
CREATE TABLE public.fixtures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent TEXT NOT NULL,
  our_score INT,
  their_score INT,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  played_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fixture_lineups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  slot INT NOT NULL,
  is_sub BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(fixture_id, slot),
  UNIQUE(fixture_id, player_id)
);

ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixture_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fixtures" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Public insert fixtures" ON public.fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fixtures" ON public.fixtures FOR UPDATE USING (true);
CREATE POLICY "Public delete fixtures" ON public.fixtures FOR DELETE USING (true);

CREATE POLICY "Public read lineups" ON public.fixture_lineups FOR SELECT USING (true);
CREATE POLICY "Public insert lineups" ON public.fixture_lineups FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update lineups" ON public.fixture_lineups FOR UPDATE USING (true);
CREATE POLICY "Public delete lineups" ON public.fixture_lineups FOR DELETE USING (true);

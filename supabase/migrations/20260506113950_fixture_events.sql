CREATE TABLE public.fixture_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fixture_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fixture_events" ON public.fixture_events FOR SELECT USING (true);
CREATE POLICY "Public insert fixture_events" ON public.fixture_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fixture_events" ON public.fixture_events FOR UPDATE USING (true);
CREATE POLICY "Public delete fixture_events" ON public.fixture_events FOR DELETE USING (true);

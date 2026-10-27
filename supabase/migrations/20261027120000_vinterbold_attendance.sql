-- Seasons can turn on sign-up (tilmelding): each player marks whether they can play a fixture.
-- "Vinterbold" is the first season with it and becomes the active season.

ALTER TABLE public.seasons
  ADD COLUMN attendance_enabled BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.seasons (name, sort_order, is_active, attendance_enabled)
VALUES (
  'Vinterbold',
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.seasons),
  true,
  true
);

-- One answer per player per fixture. No row means "Ej tilkendegivet".
CREATE TABLE public.fixture_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('yes', 'no')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, player_id)
);

ALTER TABLE public.fixture_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fixture_attendance" ON public.fixture_attendance FOR SELECT USING (true);
CREATE POLICY "Public insert fixture_attendance" ON public.fixture_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fixture_attendance" ON public.fixture_attendance FOR UPDATE USING (true);
CREATE POLICY "Public delete fixture_attendance" ON public.fixture_attendance FOR DELETE USING (true);

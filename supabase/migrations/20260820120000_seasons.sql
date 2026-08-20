-- Seasons: fixtures (and therefore lineups, events and stats) belong to a season.
-- Existing fixtures are archived into "Forår 25/26"; "Efterår 25/26" starts active.

CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public insert seasons" ON public.seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update seasons" ON public.seasons FOR UPDATE USING (true);
CREATE POLICY "Public delete seasons" ON public.seasons FOR DELETE USING (true);

-- Exactly one season is the active one: flipping a season on turns the others off.
CREATE OR REPLACE FUNCTION public.seasons_enforce_single_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seasons SET is_active = false WHERE id <> NEW.id AND is_active;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seasons_single_active
AFTER INSERT OR UPDATE OF is_active ON public.seasons
FOR EACH ROW WHEN (NEW.is_active)
EXECUTE FUNCTION public.seasons_enforce_single_active();

INSERT INTO public.seasons (name, sort_order, is_active) VALUES ('Forår 25/26', 1, false);
INSERT INTO public.seasons (name, sort_order, is_active) VALUES ('Efterår 25/26', 2, true);

-- Archive everything played so far into Forår 25/26.
ALTER TABLE public.fixtures
  ADD COLUMN season_id UUID REFERENCES public.seasons(id) ON DELETE RESTRICT;

UPDATE public.fixtures
  SET season_id = (SELECT id FROM public.seasons WHERE name = 'Forår 25/26');

ALTER TABLE public.fixtures ALTER COLUMN season_id SET NOT NULL;

CREATE INDEX fixtures_season_id_idx ON public.fixtures (season_id);

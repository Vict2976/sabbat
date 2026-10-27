-- Players on the pitch per side, keeper included. Vinterbold is 7-a-side; everything else is 11.
ALTER TABLE public.seasons
  ADD COLUMN team_size INT NOT NULL DEFAULT 11 CHECK (team_size BETWEEN 5 AND 11);

UPDATE public.seasons SET team_size = 7 WHERE name = 'Vinterbold';

-- Vinterbold fixtures were created with the 11-a-side default; start them on a 7-a-side formation.
-- Clearing the starters is safe because no Vinterbold lineups have been made yet.
DELETE FROM public.fixture_lineups l
USING public.fixtures f, public.seasons s
WHERE l.fixture_id = f.id AND f.season_id = s.id AND s.name = 'Vinterbold' AND NOT l.is_sub;

UPDATE public.fixtures f
SET formation = '2-3-1'
FROM public.seasons s
WHERE f.season_id = s.id AND s.name = 'Vinterbold';

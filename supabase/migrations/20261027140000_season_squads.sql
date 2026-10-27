-- Each season has its own squad (trup). Players stay global; this only says who is in which season.
CREATE TABLE public.season_players (
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, player_id)
);

ALTER TABLE public.season_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read season_players" ON public.season_players FOR SELECT USING (true);
CREATE POLICY "Public insert season_players" ON public.season_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update season_players" ON public.season_players FOR UPDATE USING (true);
CREATE POLICY "Public delete season_players" ON public.season_players FOR DELETE USING (true);

-- Existing seasons keep the whole squad they had.
INSERT INTO public.season_players (season_id, player_id)
SELECT s.id, p.id
FROM public.seasons s
CROSS JOIN public.players p
WHERE s.name <> 'Vinterbold';

-- Vinterbold squad.
INSERT INTO public.season_players (season_id, player_id)
SELECT s.id, p.id
FROM public.seasons s
JOIN public.players p ON p.name IN (
  'Carl Andersen',
  'Carl Willer Daverkosen',
  'Casper Wolf Frandsen',
  'Emil Palomares',
  'Hans Dylmer',
  'Jonathan Lantow-Humble',
  'Laurits Balstrup',
  'Lucas Bjergskov Larsen',
  'Ludvig Smidl',
  'Magnus Levinsen',
  'Marius Bøjer',
  'Mikkel Emil Vesten Pedersen',
  'Milo Duckert Aurvig',
  'Oscar Kraft',
  'Rasmus Mejlvang',
  'Søren Michelsen',
  'Troels Adrian Mau Thomsen',
  'Victor Brorson',
  'Vincent Kortenbach'
)
WHERE s.name = 'Vinterbold';

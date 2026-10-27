-- Efterår 25/26 stays the active season; Vinterbold is only selectable.
-- The single-active trigger switches Vinterbold off.
UPDATE public.seasons SET is_active = true WHERE name = 'Efterår 25/26';

-- Vinterbold fixtures (Herresenior 2 7:7 VinterBOLD, Pulje 5). We play as Skjold (2).
INSERT INTO public.fixtures (opponent, played_at, kickoff_time, season_id)
SELECT f.opponent, f.played_at::date, f.kickoff_time::time, s.id
FROM public.seasons s
CROSS JOIN (VALUES
  ('Ørestad IF',        '2026-11-14', '16:00'),
  ('Rødovre (2)',       '2026-11-28', '14:00'),
  ('Vestia',            '2026-12-12', '14:00'),
  ('Skovshoved IF (1)', '2027-01-18', '22:00'),
  ('Sønderbro Fight',   '2027-01-31', '15:00'),
  ('Ørestad IF',        '2027-02-06', '15:15'),
  ('Rødovre (2)',       '2027-02-08', '20:30'),
  ('Vestia',            '2027-03-06', '15:15'),
  ('Skovshoved IF (1)', '2027-03-13', '15:15'),
  ('Sønderbro Fight',   '2027-03-16', '20:30')
) AS f(opponent, played_at, kickoff_time)
WHERE s.name = 'Vinterbold';

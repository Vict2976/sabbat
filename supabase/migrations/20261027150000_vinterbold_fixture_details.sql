-- Vinterbold program from DBU: venue (spillested) and kickoff per match. Mødetid is always 1 hour before kickoff.
-- Matches are identified by date — there is one Vinterbold match per day.
UPDATE public.fixtures f
SET opponent = v.opponent,
    kickoff_time = v.kickoff_time::time,
    meeting_time = v.kickoff_time::time - INTERVAL '1 hour',
    place = v.place
FROM public.seasons s,
(VALUES
  ('2026-11-14', 'Ørestad IF',        '16:00', 'Ørestad Idrætspark (kunst)'),
  ('2026-11-28', 'Rødovre (2)',       '14:00', 'Ryparken Idrætsanlæg'),
  ('2026-12-12', 'Vestia',            '14:00', 'Bavnehøj Idrætsanlæg'),
  ('2027-01-18', 'Skovshoved IF (1)', '22:00', 'Skovshoved I P'),
  ('2027-01-31', 'Sønderbro Fight',   '15:00', 'Ryparken Idrætsanlæg'),
  ('2027-02-06', 'Ørestad IF',        '15:15', 'Ryparken Idrætsanlæg'),
  ('2027-02-08', 'Rødovre (2)',       '20:45', 'Rødovre Stadion Kunst'),
  ('2027-03-06', 'Vestia',            '15:15', 'Ryparken Idrætsanlæg'),
  ('2027-03-13', 'Skovshoved IF (1)', '15:15', 'Ryparken Idrætsanlæg'),
  ('2027-03-16', 'Sønderbro Fight',   '20:30', 'Kløvermarkens Idrætsanlæg')
) AS v(played_at, opponent, kickoff_time, place)
WHERE s.name = 'Vinterbold'
  AND f.season_id = s.id
  AND f.played_at = v.played_at::date;

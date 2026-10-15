-- =====================================================================
--  ФИЗИКА + МУЗЫКА: «Музыка» және «Физика» бөлімдерін қосу
--  Supabase → SQL Editor → New query → осы мәтінді қойып, Run басыңыз.
--  Бір рет іске қосу жеткілікті; қайта іске қоссаңыз да зияны жоқ.
--  Бұрын жүктелген материалдардың бәрі «Музыка» бөлімінде қалады.
-- =====================================================================

alter table public.materials
  add column if not exists subject text not null default 'music'
  check (subject in ('music', 'physics'));

create index if not exists materials_subject_idx on public.materials (subject);

-- Supabase API жаңа бағанды бірден көруі үшін
notify pgrst, 'reload schema';

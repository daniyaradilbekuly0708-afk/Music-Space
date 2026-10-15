-- =====================================================================
--  «Ағылшын тілі» бөлімін қосу
--  Supabase → SQL Editor → New query → осы мәтінді қойып, Run басыңыз.
--  Бір рет іске қосу жеткілікті; қайта іске қоссаңыз да зияны жоқ.
--  (Ойындар бұл қадамсыз да жұмыс істейді; бұл тек ағылшын тіліне
--   аудио/видео/сурет жүктеу үшін керек.)
-- =====================================================================

alter table public.materials
  add column if not exists subject text not null default 'music';

alter table public.materials drop constraint if exists materials_subject_check;
alter table public.materials
  add constraint materials_subject_check check (subject in ('music', 'physics', 'english'));

notify pgrst, 'reload schema';

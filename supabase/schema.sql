-- =====================================================================
--  MUSIC SPACE — Музыка әлемі
--  Supabase: дерекқор кестесі, қойма (Storage) бакеттері және
--  қауіпсіздік ережелері (RLS).
--
--  Қалай іске қосу керек:
--  Supabase Dashboard → SQL Editor → New query → осы файлды толық қойып → Run.
--  Скриптті бірнеше рет іске қосуға болады (қайталанса, қате бермейді).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Мұғалімдер тізімі
--    Мұнда тек материал жүктей / өңдей / өшіре алатын адамдар болады.
--    Пайдаланушыны Authentication → Users арқылы жасағаннан кейін
--    оны осы кестеге қосыңыз (README-дегі 4-қадамды қараңыз).
-- ---------------------------------------------------------------------
create table if not exists public.teachers (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

drop policy if exists "teachers: read own row" on public.teachers;
create policy "teachers: read own row"
  on public.teachers for select
  to authenticated
  using (user_id = auth.uid());
-- teachers кестесіне INSERT/UPDATE/DELETE саясаты әдейі жоқ:
-- оны тек Dashboard / SQL Editor арқылы өзгертуге болады.

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.teachers where user_id = auth.uid());
$$;

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Материалдар кестесі
-- ---------------------------------------------------------------------
create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('audio', 'video', 'image')),
  title        text not null check (char_length(btrim(title)) between 1 and 120),
  description  text not null default '' check (char_length(description) <= 600),
  file_path    text not null,
  cover_path   text,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  is_published boolean not null default true,
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint materials_mime_matches_type check (
       (type = 'audio' and mime_type in ('audio/mpeg', 'audio/wav', 'audio/ogg'))
    or (type = 'video' and mime_type in ('video/mp4', 'video/webm'))
    or (type = 'image' and mime_type in ('image/jpeg', 'image/png', 'image/webp'))
  )
);

-- Сайттың бөлімі: музыка, физика немесе ағылшын тілі (кейін қосылған баған)
alter table public.materials
  add column if not exists subject text not null default 'music'
  check (subject in ('music', 'physics', 'english'));

-- Баған бұрыннан болса, тексеруді жаңартамыз («Ағылшын тілі» қосылды)
alter table public.materials drop constraint if exists materials_subject_check;
alter table public.materials add constraint materials_subject_check check (subject in ('music', 'physics', 'english'));

create index if not exists materials_created_at_idx on public.materials (created_at desc);
create index if not exists materials_subject_idx on public.materials (subject);
create index if not exists materials_type_idx on public.materials (type);

alter table public.materials enable row level security;

drop policy if exists "materials: everyone reads published" on public.materials;
create policy "materials: everyone reads published"
  on public.materials for select
  to anon, authenticated
  using (is_published or public.is_teacher());

drop policy if exists "materials: teacher inserts" on public.materials;
create policy "materials: teacher inserts"
  on public.materials for insert
  to authenticated
  with check (public.is_teacher());

drop policy if exists "materials: teacher updates" on public.materials;
create policy "materials: teacher updates"
  on public.materials for update
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "materials: teacher deletes" on public.materials;
create policy "materials: teacher deletes"
  on public.materials for delete
  to authenticated
  using (public.is_teacher());

-- ---------------------------------------------------------------------
-- 3. Сервер жағындағы тексеру (триггер)
--    Жаңа жазба қосылғанда: файл шынымен қоймада бар ма, оның нақты
--    форматы мен көлемі қандай — бәрі Storage метадеректерінен алынады.
--    Браузер жіберген мәндерге сенбейміз.
-- ---------------------------------------------------------------------
create or replace function public.materials_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_bucket text;
  v_meta   jsonb;
begin
  if tg_op = 'UPDATE' then
    if new.type <> old.type
       or new.file_path <> old.file_path
       or new.cover_path is distinct from old.cover_path then
      raise exception 'Материалдың түрін немесе файлын өзгертуге болмайды';
    end if;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    return new;
  end if;

  v_bucket := case new.type when 'audio' then 'audio' when 'video' then 'video' else 'images' end;

  select o.metadata into v_meta
  from storage.objects o
  where o.bucket_id = v_bucket and o.name = new.file_path;

  if not found then
    raise exception 'Файл қоймадан табылмады (%/%)', v_bucket, new.file_path;
  end if;

  new.mime_type  := coalesce(v_meta ->> 'mimetype', new.mime_type);
  new.size_bytes := coalesce((v_meta ->> 'size')::bigint, new.size_bytes);

  if new.cover_path is not null then
    if new.type <> 'video' then
      raise exception 'Мұқаба тек видеоға қосылады';
    end if;
    if not exists (select 1 from storage.objects
                   where bucket_id = 'images' and name = new.cover_path) then
      raise exception 'Мұқаба суреті қоймадан табылмады';
    end if;
  end if;

  new.title      := btrim(new.title);
  new.created_by := auth.uid();
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists materials_before_write on public.materials;
create trigger materials_before_write
  before insert or update on public.materials
  for each row execute function public.materials_before_write();

-- ---------------------------------------------------------------------
-- 4. Storage бакеттері
--    Әр бакетте сервер деңгейінде рұқсат етілген форматтар (MIME)
--    және ең үлкен файл көлемі бекітілген. Бұдан тыс файлды
--    сервер өзі қабылдамайды.
--
--    ЕСКЕРТУ: Supabase Free жоспарында бір файлдың ең үлкен көлемі —
--    50 МБ. Pro жоспарында видео шегін көбейтуге болады:
--    төмендегі 52428800 санын өзгертіңіз (мысалы, 524288000 = 500 МБ)
--    және .env файлындағы VITE_MAX_VIDEO_MB мәнін сәйкестендіріңіз.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio',  'audio',  true, 52428800, array['audio/mpeg', 'audio/wav', 'audio/ogg']),           -- 50 МБ
  ('video',  'video',  true, 52428800, array['video/mp4', 'video/webm']),                        -- 50 МБ
  ('images', 'images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])           -- 10 МБ
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Файлдарды көру: бакеттер "public", сондықтан ойнату/көру
-- үшін арнайы саясат керек емес. Тізімдеу мен басқару — тек мұғалімге.
drop policy if exists "music-space: teacher select" on storage.objects;
create policy "music-space: teacher select"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('audio', 'video', 'images') and public.is_teacher());

drop policy if exists "music-space: teacher insert" on storage.objects;
create policy "music-space: teacher insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('audio', 'video', 'images') and public.is_teacher());

drop policy if exists "music-space: teacher update" on storage.objects;
create policy "music-space: teacher update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('audio', 'video', 'images') and public.is_teacher())
  with check (bucket_id in ('audio', 'video', 'images') and public.is_teacher());

drop policy if exists "music-space: teacher delete" on storage.objects;
create policy "music-space: teacher delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('audio', 'video', 'images') and public.is_teacher());

-- =====================================================================
-- 5. Мұғалімді қосу (пайдаланушыны жасағаннан кейін іске қосыңыз):
--
--   insert into public.teachers (user_id)
--   select id from auth.users where email = 'mugalim@mektep.kz'
--   on conflict do nothing;
-- =====================================================================

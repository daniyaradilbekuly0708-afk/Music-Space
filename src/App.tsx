import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuDatabase, LuFlaskConical, LuLayoutDashboard, LuQrCode, LuRefreshCw, LuSearch, LuX } from 'react-icons/lu';
import type { AppUser, Material, MaterialPatch, MaterialType, NewMaterialInput, Repo } from './types';
import { getRepo } from './lib/repo';
import { DEMO_LOGIN } from './lib/demoRepo';
import { captureVideoFrame } from './lib/media';
import Background from './components/Background';
import Header from './components/Header';
import Hero from './components/Hero';
import Tabs from './components/Tabs';
import AudioCard from './components/AudioCard';
import VideoCard from './components/VideoCard';
import ImageCard from './components/ImageCard';
import VideoPlayer from './components/VideoPlayer';
import Lightbox from './components/Lightbox';
import EmptyState from './components/EmptyState';
import UploadModal from './components/UploadModal';
import EditModal from './components/EditModal';
import LoginModal from './components/LoginModal';
import ConfirmDialog from './components/ConfirmDialog';
import QrModal from './components/QrModal';
import QrListModal from './components/QrListModal';
import AudioSpotlight from './components/AudioSpotlight';
import { clearLinkedMaterial, linkedMaterialId } from './lib/qr';
import GamesHub from './components/games/GamesHub';
import type { SectionId } from './components/Tabs';
import Toasts, { type Toast, type ToastKind } from './components/Toasts';
import type { MaterialActions } from './components/CardActions';

type StatusFilter = 'all' | 'published' | 'draft';

const SECTION_TITLE: Record<SectionId, { title: string; sub: string }> = {
  games: { title: 'Ойындар', sub: 'Табиғат құбылыстары мен музыкаға арналған ойындар' },
  audio: { title: 'Аудио', sub: 'Әуендерді сайттың ішінде тыңдаңыз' },
  video: { title: 'Видео', sub: 'Бейнежазбаларды толық экранда көріңіз' },
  image: { title: 'Суреттер', sub: 'Музыкалық суреттер галереясы' },
};

export default function App() {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [teacher, setTeacher] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<SectionId>('audio');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Material | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [qrFor, setQrFor] = useState<Material | null>(null);
  const [qrListOpen, setQrListOpen] = useState(false);
  const [spotlight, setSpotlight] = useState<Material | null>(null);
  const linkHandled = useRef(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const load = useCallback(async (r: Repo) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [list, u, isT] = await Promise.all([r.list(), r.getUser(), r.isTeacher()]);
      setMaterials(list);
      setUser(u);
      setTeacher(isT);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Материалдарды жүктеу мүмкін болмады.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    getRepo()
      .then((r) => {
        setRepo(r);
        load(r);
        unsub = r.onAuthChange(() => load(r));
      })
      .catch(() => {
        setLoadError('Қосымшаны іске қосу мүмкін болмады.');
        setLoading(false);
      });
    return () => unsub?.();
  }, [load]);

  // QR код арқылы ашылса (?m=<id>): сол материалды бірден ойнату / ашу
  useEffect(() => {
    if (loading || linkHandled.current) return;
    const id = linkedMaterialId();
    if (!id) return;
    linkHandled.current = true;
    const m = materials.find((x) => x.id === id);
    if (!m) {
      clearLinkedMaterial();
      toast('error', 'Бұл QR кодтағы материал табылмады немесе әзірге жарияланбаған.');
      return;
    }
    setTab(m.type);
    if (m.type === 'audio') setSpotlight(m);
    else if (m.type === 'video') setPlayingVideo(m);
    else {
      const images = materials.filter((x) => x.type === 'image' && (teacher || x.is_published)).sort((a, b) => b.created_at.localeCompare(a.created_at));
      setLightboxIndex(Math.max(0, images.findIndex((x) => x.id === m.id)));
    }
  }, [loading, materials, teacher, toast]);

  const closeSpotlight = useCallback(() => {
    setSpotlight(null);
    clearLinkedMaterial();
  }, []);

  // Мұғалім шыққанда сүзгіні қалпына келтіру
  useEffect(() => {
    if (!teacher) setStatus('all');
  }, [teacher]);

  const counts = useMemo(() => {
    const c: Record<MaterialType, number> = { audio: 0, video: 0, image: 0 };
    for (const m of materials) if (m.is_published || teacher) c[m.type]++;
    return c;
  }, [materials, teacher]);

  const publishedCounts = useMemo(() => {
    const c: Record<MaterialType, number> = { audio: 0, video: 0, image: 0 };
    for (const m of materials) if (m.is_published) c[m.type]++;
    return c;
  }, [materials]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('kk');
    return materials
      .filter((m) => m.type === tab)
      .filter((m) => (teacher ? true : m.is_published))
      .filter((m) => (status === 'all' ? true : status === 'published' ? m.is_published : !m.is_published))
      .filter((m) => !q || m.title.toLocaleLowerCase('kk').includes(q) || m.description.toLocaleLowerCase('kk').includes(q))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [materials, tab, query, status, teacher]);

  const stats = useMemo(() => {
    const total = materials.length;
    const published = materials.filter((m) => m.is_published).length;
    return { total, published, drafts: total - published };
  }, [materials]);

  /* ---------- әрекеттер ---------- */

  const handleUpload = async (input: NewMaterialInput, onProgress: (f: number) => void) => {
    if (!repo) throw new Error('Қосымша әлі дайын емес.');
    let cover = input.cover;
    if (input.type === 'video' && !cover) cover = await captureVideoFrame(input.file);
    const created = await repo.create({ ...input, cover }, onProgress);
    setMaterials((list) => [created, ...list.filter((m) => m.id !== created.id)]);
    setTab(created.type);
    setQuery('');
    toast('success', created.is_published ? 'Материал сәтті жүктелді және жарияланды!' : 'Материал жоба ретінде сақталды.');
  };

  const handleSave = async (id: string, patch: MaterialPatch) => {
    if (!repo) return;
    const updated = await repo.update(id, patch);
    setMaterials((list) => list.map((m) => (m.id === id ? updated : m)));
    toast('success', 'Өзгерістер сақталды.');
  };

  const handleDelete = async (m: Material) => {
    if (!repo) return;
    try {
      await repo.remove(m);
      setMaterials((list) => list.filter((x) => x.id !== m.id));
      toast('success', 'Материал өшірілді.');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Өшіру мүмкін болмады.');
    }
  };

  const togglePublish = async (m: Material) => {
    if (!repo) return;
    try {
      const updated = await repo.update(m.id, { is_published: !m.is_published });
      setMaterials((list) => list.map((x) => (x.id === m.id ? updated : x)));
      toast('info', updated.is_published ? 'Материал жарияланды.' : 'Материал жасырылды (жоба).');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Өзгерту мүмкін болмады.');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    if (!repo) return;
    await repo.signIn(email, password);
    setLoginOpen(false);
    await load(repo);
    toast('success', 'Қош келдіңіз! Енді материал жүктей аласыз.');
  };

  const handleLogout = async () => {
    if (!repo) return;
    await repo.signOut();
    setTeacher(false);
    setUser(null);
    await load(repo);
    toast('info', 'Жүйеден шықтыңыз.');
  };

  const actions: MaterialActions = {
    onEdit: setEditing,
    onDelete: setDeleting,
    onTogglePublish: togglePublish,
    onQr: setQrFor,
  };

  const imageItems = tab === 'image' ? visible : [];
  const demo = repo?.mode === 'demo';
  const section = SECTION_TITLE[tab];

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Background />
      <Header mode={repo?.mode ?? null} user={user} teacher={teacher} onLogin={() => setLoginOpen(true)} onLogout={handleLogout} onUpload={() => setUploadOpen(true)} />

      {demo && (
        <div className="border-b border-amber-300/15 bg-amber-400/[0.06]">
          <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2 text-[12.5px] leading-relaxed text-amber-100/90 sm:items-center sm:px-6">
            <LuFlaskConical className="mt-0.5 size-4 shrink-0 text-amber-300 sm:mt-0" />
            <span>
              <b>Демо режим:</b> материалдар тек осы браузерде сақталады, басқа құрылғыларда көрінбейді. Нақты серверге қосу үшін Supabase кілттерін баптаңыз (README).
            </span>
          </p>
        </div>
      )}

      <main className="flex-1">
        <Hero counts={publishedCounts} />

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6" id="materials">
          {teacher && (
            <div className="glass mb-6 flex animate-fade-up flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-gold-400/15 ring-1 ring-gold-400/30">
                  <LuLayoutDashboard className="size-5 text-gold-300" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white">Мұғалімнің басқару панелі</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-gold !px-3.5 !py-1.5 !text-xs" onClick={() => setQrListOpen(true)}>
                  <LuQrCode className="size-3.5" />
                  QR кодтар
                </button>
                {(
                  [
                    { id: 'all', label: 'Барлығы', n: stats.total },
                    { id: 'published', label: 'Жарияланған', n: stats.published },
                    { id: 'draft', label: 'Жобада', n: stats.drafts },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(s.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${status === s.id ? 'bg-white text-ink-950' : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'}`}
                  >
                    {s.label} <span className="opacity-60">{s.n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              active={tab}
              onChange={(t) => {
                setTab(t);
                setQuery('');
              }}
              counts={counts}
            />
            <div className={`relative w-full lg:w-80 ${tab === 'games' ? 'hidden' : ''}`}>
              <LuSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${section.title} ішінен іздеу…`}
                className="field !rounded-2xl !py-3 pr-10 pl-11"
                aria-label="Іздеу"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="icon-btn absolute top-1/2 right-1.5 !size-8 -translate-y-1/2" aria-label="Іздеуді тазалау">
                  <LuX className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{section.sub}</p>
            </div>
            {tab !== 'games' && !loading && visible.length > 0 && (
              <p className="shrink-0 text-xs font-semibold text-slate-500">
                {visible.length} материал · жаңалары алдымен
              </p>
            )}
          </div>

          {tab === 'games' ? (
            <GamesHub />
          ) : loading ? (
            <div className={tab === 'image' ? 'columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`glass mb-5 animate-pulse rounded-3xl ${tab === 'audio' ? 'h-56' : tab === 'video' ? 'h-72' : i % 2 ? 'h-64' : 'h-80'}`} />
              ))}
            </div>
          ) : loadError ? (
            <div className="glass mx-auto max-w-lg rounded-3xl px-6 py-10 text-center">
              <p className="font-display text-base font-semibold text-white">Материалдарды жүктеу мүмкін болмады</p>
              <p className="mt-2 text-sm text-rose-200/90">{loadError}</p>
              {repo && (
                <button type="button" className="btn-ghost mt-5" onClick={() => load(repo)}>
                  <LuRefreshCw className="size-4" /> Қайталау
                </button>
              )}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState type={tab as MaterialType} searching={Boolean(query.trim()) || status !== 'all'} teacher={teacher} onUpload={() => setUploadOpen(true)} />
          ) : tab === 'audio' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((m, i) => (
                <AudioCard key={m.id} m={m} teacher={teacher} actions={actions} index={i} />
              ))}
            </div>
          ) : tab === 'video' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((m, i) => (
                <VideoCard key={m.id} m={m} teacher={teacher} actions={actions} index={i} onOpen={setPlayingVideo} />
              ))}
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
              {visible.map((m, i) => (
                <ImageCard key={m.id} m={m} teacher={teacher} actions={actions} index={i} onOpen={() => setLightboxIndex(i)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-ink-950/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} <span className="font-display font-semibold tracking-wider text-slate-300">MUSIC SPACE</span> — Музыка әлемі
          </p>
          <p className="inline-flex items-center gap-1.5">
            {demo ? <LuFlaskConical className="size-3.5" /> : <LuDatabase className="size-3.5" />}
            {demo ? 'Демо режим' : 'Материалдар серверде сақталады'}
          </p>
        </div>
      </footer>

      <UploadModal open={uploadOpen} initialType={tab === 'games' ? 'audio' : tab} demo={demo} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <EditModal material={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      <ConfirmDialog material={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
      <LoginModal open={loginOpen} demo={demo} demoLogin={demo ? DEMO_LOGIN : null} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
      <QrListModal open={qrListOpen} materials={materials} onClose={() => setQrListOpen(false)} onPick={(m) => setQrFor(m)} />
      <QrModal material={qrFor} onClose={() => setQrFor(null)} />
      {spotlight && <AudioSpotlight m={spotlight} onClose={closeSpotlight} />}
      {playingVideo && (
        <VideoPlayer
          m={playingVideo}
          onClose={() => {
            setPlayingVideo(null);
            clearLinkedMaterial();
          }}
        />
      )}
      {lightboxIndex !== null && imageItems.length > 0 && (
        <Lightbox items={imageItems} index={Math.min(lightboxIndex, imageItems.length - 1)} onIndex={setLightboxIndex} onClose={() => {
            setLightboxIndex(null);
            clearLinkedMaterial();
          }} />
      )}
      <Toasts toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}

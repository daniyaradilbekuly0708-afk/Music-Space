import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { LuCircleAlert, LuCircleCheck, LuCloudUpload, LuHeadphones, LuImage, LuImages, LuMonitorPlay, LuX } from 'react-icons/lu';
import Modal from './Modal';
import type { MaterialType, NewMaterialInput } from '../types';
import { DESCRIPTION_MAX, TITLE_MAX, TYPE_CONFIG, detectType, formatBytes, validateFile } from '../lib/config';

interface Props {
  open: boolean;
  initialType: MaterialType;
  demo: boolean;
  onClose: () => void;
  onUpload: (input: NewMaterialInput, onProgress: (f: number) => void) => Promise<void>;
}

const TYPES: { id: MaterialType; label: string; icon: typeof LuHeadphones }[] = [
  { id: 'audio', label: 'Аудио', icon: LuHeadphones },
  { id: 'video', label: 'Видео', icon: LuMonitorPlay },
  { id: 'image', label: 'Сурет', icon: LuImages },
];

type Phase = 'form' | 'uploading' | 'done';

export default function UploadModal({ open, initialType, demo, onClose, onUpload }: Props) {
  const [type, setType] = useState<MaterialType>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publish, setPublish] = useState(true);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const reset = (t: MaterialType = initialType) => {
    setType(t);
    setFile(null);
    setCover(null);
    setTitle('');
    setDescription('');
    setPublish(true);
    setError(null);
    setPhase('form');
    setProgress(0);
  };

  // Тек терезе ашылған сәтте тазалаймыз (жүктелгеннен кейін бөлім ауысса да, нәтиже экраны сақталады).
  useEffect(() => {
    if (open) reset(initialType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!file || type === 'audio') return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file, type]);

  useEffect(() => {
    if (!cover) return setCoverPreview(null);
    const u = URL.createObjectURL(cover);
    setCoverPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [cover]);

  const pickFile = (f: File | undefined | null) => {
    if (!f) return;
    setError(null);
    const detected = detectType(f);
    const t = detected ?? type;
    const check = validateFile(t, f);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (detected && detected !== type) {
      setType(detected);
      if (detected !== 'video') setCover(null);
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, TITLE_MAX));
  };

  const pickCover = (f: File | undefined | null) => {
    if (!f) return;
    const check = validateFile('image', f);
    if (!check.ok) {
      setError(`Мұқаба: ${check.error}`);
      return;
    }
    setError(null);
    setCover(f);
  };

  const changeType = (t: MaterialType) => {
    if (phase !== 'form') return;
    setType(t);
    setError(null);
    if (file && !validateFile(t, file).ok) setFile(null);
    if (t !== 'video') setCover(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Файлды таңдаңыз.');
    const check = validateFile(type, file);
    if (!check.ok) return setError(check.error);
    if (!title.trim()) return setError('Материал атауын енгізіңіз.');
    setPhase('uploading');
    setProgress(0);
    try {
      await onUpload({ type, title: title.trim(), description: description.trim(), file, cover, is_published: publish }, setProgress);
      setProgress(1);
      setPhase('done');
    } catch (err) {
      setPhase('form');
      setError(err instanceof Error ? err.message : 'Белгісіз қате шықты. Қайталап көріңіз.');
    }
  };

  const cfg = TYPE_CONFIG[type];
  const pct = Math.round(progress * 100);
  const uploading = phase === 'uploading';

  return (
    <Modal open={open} onClose={onClose} title="Материал жүктеу" size="lg" closable={!uploading}>
      {phase === 'done' ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-duration:1.8s]" />
            <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-xl shadow-emerald-900/40">
              <LuCircleCheck className="size-10 text-ink-950" />
            </div>
          </div>
          <h3 className="font-display text-xl font-semibold text-white">Материал сәтті жүктелді!</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            «{title}» {publish ? 'жарияланды және барлық келушілерге көрінеді.' : 'жоба ретінде сақталды. Оны кейін жариялай аласыз.'}
            {demo && ' (Демо режим: тек осы браузерде сақталды.)'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-ghost" onClick={() => reset(type)}>
              Тағы жүктеу
            </button>
            <button type="button" className="btn-gold" onClick={onClose} data-autofocus>
              Дайын
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {demo && (
            <div className="flex gap-2.5 rounded-xl border border-amber-300/20 bg-amber-400/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-100">
              <LuCircleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
              <span>
                <b>Демо режим.</b> Файл серверге емес, тек осы браузерге сақталады.
              </span>
            </div>
          )}

          <div>
            <span className="label">Материал түрі</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {TYPES.map(({ id, label, icon: Icon }) => {
                const on = id === type;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={uploading}
                    onClick={() => changeType(id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-sm font-bold transition ${
                      on ? 'border-gold-400/60 bg-gold-400/10 text-gold-200 shadow-[0_0_0_4px_rgb(247_207_98/0.08)]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="label">Файл</span>
            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-9 text-center transition ${
                  drag ? 'scale-[1.01] border-gold-400 bg-gold-400/10' : 'border-white/15 bg-ink-900/50 hover:border-plum-400/60 hover:bg-plum-500/5'
                }`}
              >
                <div className={`mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-plum-500/30 to-ink-700 ring-1 ring-white/10 transition ${drag ? 'scale-110' : ''}`}>
                  <LuCloudUpload className="size-7 text-gold-300" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Файлды осы жерге сүйреп әкеліңіз <span className="text-slate-400">немесе</span> <span className="text-gold-300 underline decoration-gold-400/40 underline-offset-4">компьютерден таңдаңыз</span>
                </p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {cfg.formatsLabel} · ең көбі {cfg.maxMB} МБ
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
                {preview && type === 'image' && <img src={preview} alt="" className="max-h-56 w-full object-contain bg-black/30" />}
                {preview && type === 'video' && <video src={preview} className="max-h-56 w-full bg-black" muted controls playsInline />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-plum-500/20 text-plum-200">
                    {type === 'audio' ? <LuHeadphones className="size-5" /> : type === 'video' ? <LuMonitorPlay className="size-5" /> : <LuImage className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                  {!uploading && (
                    <button type="button" className="icon-btn" onClick={() => setFile(null)} aria-label="Файлды алып тастау">
                      <LuX className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <input ref={fileInput} type="file" accept={cfg.accept} className="hidden" onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ''))} />
          </div>

          {type === 'video' && (
            <div>
              <span className="label">
                Мұқаба суреті <span className="font-normal text-slate-500">(міндетті емес)</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => coverInput.current?.click()}
                  className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-ink-900/60 transition hover:border-gold-400/50"
                  aria-label="Мұқаба таңдау"
                >
                  {coverPreview ? <img src={coverPreview} alt="" className="size-full object-cover" /> : <LuImage className="size-6 text-slate-500" />}
                </button>
                <p className="text-xs leading-relaxed text-slate-400">
                  {cover ? (
                    <>
                      {cover.name}{' '}
                      {!uploading && (
                        <button type="button" className="font-semibold text-rose-300 hover:underline" onClick={() => setCover(null)}>
                          алып тастау
                        </button>
                      )}
                    </>
                  ) : (
                    'JPG, PNG немесе WEBP. Таңдамасаңыз, мұқаба видеодан автоматты түрде алынады.'
                  )}
                </p>
              </div>
              <input ref={coverInput} type="file" accept={TYPE_CONFIG.image.accept} className="hidden" onChange={(e) => (pickCover(e.target.files?.[0]), (e.target.value = ''))} />
            </div>
          )}

          <div>
            <label className="label" htmlFor="up-title">
              Материал атауы
            </label>
            <input id="up-title" className="field" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="Мысалы: Құрманғазы — «Сарыарқа» күйі" disabled={uploading} required />
          </div>

          <div>
            <label className="label" htmlFor="up-desc">
              Қысқаша сипаттама
            </label>
            <textarea id="up-desc" className="field min-h-24 resize-y" value={description} maxLength={DESCRIPTION_MAX} onChange={(e) => setDescription(e.target.value)} placeholder="Материал туралы бірер сөйлем…" disabled={uploading} />
            <p className="mt-1 text-right text-[11px] text-slate-500 tabular-nums">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-white">Бірден жариялау</span>
              <span className="block text-xs text-slate-400">Өшірулі болса, материал жоба ретінде сақталады және оқушыларға көрінбейді.</span>
            </span>
            <input type="checkbox" className="peer sr-only" checked={publish} onChange={(e) => setPublish(e.target.checked)} disabled={uploading} />
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-gold-500 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
          </label>

          {error && (
            <div className="flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-100" role="alert">
              <LuCircleAlert className="mt-0.5 size-4 shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {uploading && (
            <div aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-300">Жүктелуде…</span>
                <span className="font-display text-gold-300 tabular-nums">{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="relative h-full rounded-full bg-gradient-to-r from-plum-500 via-plum-400 to-gold-400 transition-[width] duration-200" style={{ width: `${pct}%` }}>
                  <span className="absolute inset-0 animate-pulse bg-white/20" />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={uploading}>
              Бас тарту
            </button>
            <button type="submit" className="btn-gold min-w-36" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                  {pct}%
                </>
              ) : (
                <>
                  <LuCloudUpload className="size-4" />
                  Жүктеу
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

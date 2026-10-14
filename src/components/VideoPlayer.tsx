import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuMaximize, LuMinimize, LuPause, LuPlay, LuSquare, LuVolume1, LuVolume2, LuVolumeX, LuX } from 'react-icons/lu';
import type { Material } from '../types';
import { formatTime } from '../lib/config';
import { announcePlay } from '../lib/media';

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type WebkitDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type WebkitEl = HTMLElement & { webkitRequestFullscreen?: () => void };

export default function VideoPlayer({ m, onClose }: { m: Material; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<WebkitVideo>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState(false);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      announcePlay(m.id);
      v.play().catch(() => undefined);
    } else v.pause();
  }, [m.id]);

  const stop = () => {
    const v = video.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setTime(0);
  };

  const toggleFs = useCallback(() => {
    const d = document as WebkitDoc;
    const el = wrap.current as WebkitEl | null;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      if (d.exitFullscreen) d.exitFullscreen().catch(() => undefined);
      else d.webkitExitFullscreen?.();
      return;
    }
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => video.current?.webkitEnterFullscreen?.());
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else video.current?.webkitEnterFullscreen?.(); // iPhone Safari
  }, []);

  const poke = useCallback(() => {
    setShowUi(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (video.current && !video.current.paused) setShowUi(false);
    }, 2600);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onFs = () => {
      const d = document as WebkitDoc;
      setFs(Boolean(d.fullscreenElement || d.webkitFullscreenElement));
    };
    const onKey = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
      else if (e.key === ' ' || e.key === 'k') {
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        e.preventDefault();
        toggle();
      } else if (e.key === 'f') toggleFs();
      else if (e.key === 'm') setMuted((x) => !x);
      else if (e.key === 'ArrowRight' && tag !== 'INPUT') v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      else if (e.key === 'ArrowLeft' && tag !== 'INPUT') v.currentTime = Math.max(0, v.currentTime - 5);
      poke();
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(hideTimer.current);
    };
  }, [onClose, toggle, toggleFs, poke]);

  useEffect(() => {
    if (video.current) {
      video.current.volume = volume;
      video.current.muted = muted;
    }
  }, [volume, muted]);

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const VolIcon = muted || volume === 0 ? LuVolumeX : volume < 0.5 ? LuVolume1 : LuVolume2;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-ink-950/95 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={m.title}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] text-plum-300 uppercase">Видео</p>
          <h2 className="truncate font-display text-sm font-semibold text-white sm:text-lg">{m.title}</h2>
        </div>
        <button type="button" className="icon-btn !size-11 bg-white/5" onClick={onClose} aria-label="Жабу">
          <LuX className="size-6" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-0 sm:px-6">
        <div
          ref={wrap}
          className={`group/player relative w-full max-w-6xl overflow-hidden bg-black shadow-2xl shadow-plum-900/30 ${fs ? '' : 'sm:rounded-2xl sm:ring-1 sm:ring-white/10'} ${showUi ? '' : 'cursor-none'}`}
          onMouseMove={poke}
          onTouchStart={poke}
        >
          <video
            ref={video}
            src={m.file_url}
            poster={m.cover_url ?? undefined}
            playsInline
            autoPlay
            preload="auto"
            className={`block w-full bg-black ${fs ? 'h-dvh object-contain' : 'max-h-[72dvh] object-contain'}`}
            onClick={toggle}
            onDoubleClick={toggleFs}
            onPlay={() => {
              announcePlay(m.id);
              setPlaying(true);
              poke();
            }}
            onPause={() => {
              setPlaying(false);
              setShowUi(true);
            }}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
            onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
            onProgress={(e) => {
              const b = e.currentTarget.buffered;
              if (b.length) setBuffered(b.end(b.length - 1));
            }}
            onWaiting={() => setWaiting(true)}
            onCanPlay={() => setWaiting(false)}
            onPlaying={() => setWaiting(false)}
            onError={() => {
              setError(true);
              setWaiting(false);
            }}
          />

          {waiting && !error && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="size-12 animate-spin rounded-full border-4 border-white/15 border-t-gold-400" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
              <p className="max-w-sm text-sm font-semibold text-rose-200">Видеоны ойнату мүмкін болмады. Файл бүлінген немесе браузер бұл форматты қолдамайды.</p>
            </div>
          )}
          {!playing && !waiting && !error && (
            <button type="button" onClick={toggle} className="absolute inset-0 grid place-items-center" aria-label="Ойнату">
              <span className="grid size-20 place-items-center rounded-full bg-gold-400 text-ink-950 shadow-2xl shadow-gold-600/40 transition hover:scale-105">
                <LuPlay className="ml-1 size-9" />
              </span>
            </button>
          )}

          {/* Басқару панелі */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pt-10 pb-3 transition-opacity duration-300 sm:px-5 sm:pb-4 ${
              showUi ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="relative">
              <div className="pointer-events-none absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-white/20" style={{ width: `${bufPct}%` }} />
              <input
                type="range"
                className="ms-range relative"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (video.current) video.current.currentTime = v;
                  setTime(v);
                }}
                style={{ ['--p' as string]: `${pct}%`, background: `linear-gradient(90deg, var(--color-gold-400) 0%, var(--color-plum-400) ${pct}%, transparent ${pct}%)` }}
                aria-label="Ойнату орны"
              />
            </div>
            <div className="mt-2 flex items-center gap-1 sm:gap-2">
              <button type="button" className="icon-btn" onClick={toggle} aria-label={playing ? 'Кідірту' : 'Ойнату'}>
                {playing ? <LuPause className="size-5" /> : <LuPlay className="size-5" />}
              </button>
              <button type="button" className="icon-btn" onClick={stop} aria-label="Тоқтату" title="Тоқтату">
                <LuSquare className="size-4 fill-current" />
              </button>
              <span className="ml-1 text-xs font-semibold text-slate-200 tabular-nums sm:text-sm">
                {formatTime(time)} <span className="text-slate-500">/ {formatTime(duration)}</span>
              </span>
              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <button type="button" className="icon-btn" onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Дыбысты қосу' : 'Дыбысты өшіру'}>
                  <VolIcon className="size-5" />
                </button>
                <input
                  type="range"
                  className="ms-range !w-20 sm:!w-28"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setMuted(false);
                  }}
                  style={{ ['--p' as string]: `${muted ? 0 : volume * 100}%` }}
                  aria-label="Дыбыс деңгейі"
                />
                <button type="button" className="icon-btn" onClick={toggleFs} aria-label={fs ? 'Толық экраннан шығу' : 'Толық экран'} title="Толық экран">
                  {fs ? <LuMinimize className="size-5" /> : <LuMaximize className="size-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {m.description && (
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">{m.description}</p>
        </div>
      )}
    </div>,
    document.body,
  );
}

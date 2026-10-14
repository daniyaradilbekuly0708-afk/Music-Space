import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowLeft, LuPause, LuPlay, LuSquare, LuVolume1, LuVolume2, LuVolumeX } from 'react-icons/lu';
import type { Material } from '../types';
import { formatTime } from '../lib/config';
import { announcePlay } from '../lib/media';
import { Equalizer } from './SoundWave';

/**
 * QR код арқылы ашылған аудионың толық экранды ойнатқышы.
 * Ашылған бойда ойнауға тырысады; браузер дыбысты автоматты қосуға
 * рұқсат бермесе, үлкен «Тыңдау» батырмасы көрсетіледі (бір рет басу жеткілікті).
 */
export default function AudioSpotlight({ m, onClose }: { m: Material; onClose: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const a = audio.current;
    if (a) {
      announcePlay(m.id);
      a.play()
        .then(() => setNeedsTap(false))
        .catch((e: DOMException) => {
          if (e?.name !== 'AbortError') setNeedsTap(true);
        });
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      audio.current?.pause();
    };
  }, [m.id]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
  }, [volume, muted]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      announcePlay(m.id);
      a.play()
        .then(() => {
          setNeedsTap(false);
          setError(false);
        })
        .catch(() => setError(true));
    } else a.pause();
  };

  const stop = () => {
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setTime(0);
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const VolIcon = muted || volume === 0 ? LuVolumeX : volume < 0.5 ? LuVolume1 : LuVolume2;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col overflow-y-auto bg-ink-950/95 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={m.title}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className={`absolute top-1/4 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-plum-600/30 blur-[120px] transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-50'}`} />
        <div className="absolute right-0 bottom-0 size-[360px] rounded-full bg-gold-500/10 blur-[110px]" />
      </div>

      <div className="relative flex items-center px-4 py-3 sm:px-6">
        <button type="button" onClick={onClose} className="btn-ghost !px-3.5">
          <LuArrowLeft className="size-4" />
          Сайтқа өту
        </button>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pb-12 text-center">
        <p className="mb-3 font-display text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">MUSIC SPACE · Аудио</p>
        <h1 className="font-display text-2xl leading-tight font-bold text-balance text-white sm:text-3xl">{m.title}</h1>
        {m.description && <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-slate-300/90">{m.description}</p>}

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Кідірту' : 'Тыңдау'}
          className="relative mt-10 grid size-36 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-2xl shadow-gold-600/30 transition hover:scale-105 active:scale-95"
        >
          <span className={`absolute inset-0 rounded-full bg-gold-400/30 ${playing || needsTap ? 'animate-ping [animation-duration:2.2s]' : ''}`} />
          {playing ? <LuPause className="relative size-14" /> : <LuPlay className="relative ml-2 size-14" />}
        </button>
        <p className="mt-5 h-5 text-sm font-semibold text-slate-300">
          {needsTap && !playing ? 'Тыңдау үшін батырманы басыңыз' : playing ? <Equalizer active bars={7} className="!h-5" /> : ''}
        </p>

        <div className="mt-8 w-full">
          <input
            type="range"
            className="ms-range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            disabled={!duration}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (audio.current) audio.current.currentTime = v;
              setTime(v);
            }}
            style={{ ['--p' as string]: `${pct}%` }}
            aria-label="Ойнату орны"
          />
          <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400 tabular-nums">
            <span>{formatTime(time)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-5 flex w-full items-center gap-3">
          <button type="button" className="icon-btn" onClick={stop} aria-label="Тоқтату" title="Тоқтату">
            <LuSquare className="size-4 fill-current" />
          </button>
          <div className="ml-auto flex w-44 items-center gap-2">
            <button type="button" className="icon-btn" onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Дыбысты қосу' : 'Дыбысты өшіру'}>
              <VolIcon className="size-5" />
            </button>
            <input
              type="range"
              className="ms-range"
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
          </div>
        </div>

        {error && <p className="mt-5 text-sm font-semibold text-rose-300">Аудионы ойнату мүмкін болмады. Интернет байланысын тексеріп, қайталап көріңіз.</p>}
      </div>

      <audio
        ref={audio}
        src={m.file_url}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onError={() => setError(true)}
      />
    </div>,
    document.body,
  );
}

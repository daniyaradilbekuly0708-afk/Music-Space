import { useEffect, useRef, useState } from 'react';
import { LuPause, LuPlay, LuSquare, LuVolume1, LuVolume2, LuVolumeX } from 'react-icons/lu';
import type { Material } from '../types';
import { formatBytes, formatDate, formatTime } from '../lib/config';
import { announcePlay, onOtherPlay } from '../lib/media';
import { Equalizer } from './SoundWave';
import CardActions, { DraftBadge, QrButton, type MaterialActions } from './CardActions';

interface Props {
  m: Material;
  teacher: boolean;
  actions: MaterialActions;
  index: number;
}

export default function AudioCard({ m, teacher, actions, index }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => onOtherPlay(m.id, () => audio.current?.pause()), [m.id]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
  }, [volume, muted]);

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      announcePlay(m.id);
      setLoading(true);
      try {
        await a.play();
        setError(false);
      } catch (e) {
        if ((e as DOMException)?.name !== 'AbortError') setError(true);
      } finally {
        setLoading(false);
      }
    } else {
      a.pause();
    }
  };

  const stop = () => {
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setTime(0);
  };

  const seek = (v: number) => {
    if (audio.current && duration) {
      audio.current.currentTime = v;
      setTime(v);
    }
  };

  const progress = duration ? (time / duration) * 100 : 0;
  const volPct = muted ? 0 : volume * 100;
  const VolIcon = muted || volume === 0 ? LuVolumeX : volume < 0.5 ? LuVolume1 : LuVolume2;

  return (
    <article
      className={`group glass relative flex animate-fade-up flex-col overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 ${
        playing ? 'shadow-[0_0_0_1px_rgb(246_184_81/0.35),0_20px_60px_-20px_rgb(30_155_208/0.6)]' : 'shadow-xl shadow-black/20'
      }`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className={`pointer-events-none absolute -top-24 -right-20 size-56 rounded-full bg-plum-500/25 blur-3xl transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-40'}`} />

      <div className="relative flex items-start gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Кідірту' : 'Ойнату'}
          className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-lg shadow-gold-600/25 transition hover:scale-105 active:scale-95"
        >
          {playing && <span className="absolute inset-0 animate-ping rounded-2xl bg-gold-400/30 [animation-duration:2s]" />}
          {loading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
          ) : playing ? (
            <LuPause className="relative size-6" />
          ) : (
            <LuPlay className="relative ml-0.5 size-6" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Equalizer active={playing} bars={4} className="shrink-0" />
            <span className="text-[11px] font-bold tracking-[0.12em] text-plum-300 uppercase">Аудио</span>
            <DraftBadge m={m} />
          </div>
          <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] leading-snug font-semibold text-white">{m.title}</h3>
        </div>

        {teacher && <CardActions m={m} actions={actions} className="-mt-1 -mr-1 shrink-0" />}
      </div>

      {m.description && <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300/80">{m.description}</p>}

      <div className="relative mt-auto pt-5">
        <input
          type="range"
          className="ms-range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ ['--p' as string]: `${progress}%` }}
          aria-label="Ойнату орны"
          disabled={!duration}
        />
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-400 tabular-nums">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" className="icon-btn !size-8" onClick={toggle} aria-label={playing ? 'Кідірту' : 'Ойнату'}>
            {playing ? <LuPause className="size-4" /> : <LuPlay className="size-4" />}
          </button>
          <button type="button" className="icon-btn !size-8" onClick={stop} aria-label="Тоқтату" title="Тоқтату">
            <LuSquare className="size-3.5 fill-current" />
          </button>
          <div className="ml-auto flex w-36 items-center gap-2">
            <button type="button" className="icon-btn !size-8" onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Дыбысты қосу' : 'Дыбысты өшіру'}>
              <VolIcon className="size-4" />
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
              style={{ ['--p' as string]: `${volPct}%` }}
              aria-label="Дыбыс деңгейі"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[11px] font-medium text-slate-500">
          <span>
            {formatDate(m.created_at)} · {m.mime_type.split('/')[1]?.replace('mpeg', 'mp3').toUpperCase()} · {formatBytes(m.size_bytes)}
          </span>
          <QrButton m={m} actions={actions} className="shrink-0" />
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-rose-300">Аудионы ойнату мүмкін болмады. Файл бүлінген немесе браузер бұл форматты қолдамайды.</p>}
      </div>

      <audio
        ref={audio}
        src={m.file_url}
        preload="metadata"
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
    </article>
  );
}

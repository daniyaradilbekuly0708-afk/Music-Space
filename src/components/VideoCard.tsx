import { LuPlay, LuFilm } from 'react-icons/lu';
import type { Material } from '../types';
import { formatBytes, formatDate } from '../lib/config';
import CardActions, { DraftBadge, QrButton, type MaterialActions } from './CardActions';

interface Props {
  m: Material;
  teacher: boolean;
  actions: MaterialActions;
  index: number;
  onOpen: (m: Material) => void;
}

export default function VideoCard({ m, teacher, actions, index, onOpen }: Props) {
  return (
    <article
      className="group glass relative flex animate-fade-up flex-col overflow-hidden rounded-3xl shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-white/15"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button type="button" onClick={() => onOpen(m)} className="relative block aspect-video w-full overflow-hidden bg-ink-900 text-left" aria-label={`Видеоны көру: ${m.title}`}>
        {m.cover_url ? (
          <img src={m.cover_url} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <video src={`${m.file_url}#t=1`} preload="metadata" muted playsInline className="size-full object-cover" />
        )}
        {!m.cover_url && <LuFilm className="absolute top-3 left-3 size-5 text-white/40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="relative grid size-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-gold-400 group-hover:ring-gold-300">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10 [animation-duration:2.4s]" />
            <LuPlay className="relative ml-1 size-7 text-white transition group-hover:text-ink-950" />
          </span>
        </span>
        <span className="absolute bottom-3 left-4 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gold-200 backdrop-blur">
          {m.mime_type.split('/')[1]?.toUpperCase()} · {formatBytes(m.size_bytes)}
        </span>
      </button>

      {teacher && <CardActions m={m} actions={actions} className="absolute top-3 right-3 z-10" />}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.12em] text-plum-300 uppercase">Видео</span>
          <DraftBadge m={m} />
        </div>
        <h3 className="line-clamp-2 font-display text-[15px] leading-snug font-semibold text-white">{m.title}</h3>
        {m.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300/80">{m.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[11px] font-medium text-slate-500">{formatDate(m.created_at)}</span>
          <QrButton m={m} actions={actions} />
        </div>
      </div>
    </article>
  );
}

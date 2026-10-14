import { LuMaximize2 } from 'react-icons/lu';
import type { Material } from '../types';
import CardActions, { DraftBadge, type MaterialActions } from './CardActions';

interface Props {
  m: Material;
  teacher: boolean;
  actions: MaterialActions;
  index: number;
  onOpen: () => void;
}

export default function ImageCard({ m, teacher, actions, index, onOpen }: Props) {
  return (
    <figure
      className="group glass relative mb-4 animate-fade-up break-inside-avoid overflow-hidden rounded-3xl shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 sm:mb-5"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden bg-ink-900" aria-label={`Суретті үлкейту: ${m.title}`}>
        <img src={m.file_url} alt={m.title} loading="lazy" className="block h-auto w-full transition duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="absolute right-3 bottom-3 grid size-10 translate-y-2 place-items-center rounded-full bg-gold-400 text-ink-950 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <LuMaximize2 className="size-4" />
        </span>
      </button>
      {teacher && <CardActions m={m} actions={actions} className="absolute top-3 right-3 z-10" />}
      <figcaption className="p-4">
        <DraftBadge m={m} />
        <h3 className="mt-1 line-clamp-2 font-display text-sm leading-snug font-semibold text-white">{m.title}</h3>
        {m.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-400">{m.description}</p>}
      </figcaption>
    </figure>
  );
}

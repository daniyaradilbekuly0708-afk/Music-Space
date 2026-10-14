import { LuEye, LuEyeOff, LuPencil, LuTrash2 } from 'react-icons/lu';
import type { MouseEvent } from 'react';
import type { Material } from '../types';

export interface MaterialActions {
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
  onTogglePublish: (m: Material) => void;
}

/** Мұғалімге ғана көрінетін басқару батырмалары. */
export default function CardActions({ m, actions, className = '' }: { m: Material; actions: MaterialActions; className?: string }) {
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className={`flex items-center gap-1 rounded-full border border-white/10 bg-ink-950/75 p-1 backdrop-blur ${className}`}>
      <button type="button" className="icon-btn !size-8" onClick={stop(() => actions.onTogglePublish(m))} title={m.is_published ? 'Жасыру (жобаға қайтару)' : 'Жариялау'} aria-label={m.is_published ? 'Жасыру' : 'Жариялау'}>
        {m.is_published ? <LuEye className="size-4 text-emerald-300" /> : <LuEyeOff className="size-4 text-amber-300" />}
      </button>
      <button type="button" className="icon-btn !size-8" onClick={stop(() => actions.onEdit(m))} title="Өңдеу" aria-label="Өңдеу">
        <LuPencil className="size-4" />
      </button>
      <button type="button" className="icon-btn !size-8 hover:!bg-rose-500/15 hover:!text-rose-300" onClick={stop(() => actions.onDelete(m))} title="Өшіру" aria-label="Өшіру">
        <LuTrash2 className="size-4" />
      </button>
    </div>
  );
}

export function DraftBadge({ m }: { m: Material }) {
  if (m.is_published) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-200 ring-1 ring-amber-300/25">Жоба · жарияланбаған</span>;
}

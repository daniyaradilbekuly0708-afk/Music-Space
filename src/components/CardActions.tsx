import { LuEye, LuEyeOff, LuPencil, LuQrCode, LuTrash2 } from 'react-icons/lu';
import type { MouseEvent } from 'react';
import type { Material } from '../types';

export interface MaterialActions {
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
  onTogglePublish: (m: Material) => void;
  onQr: (m: Material) => void;
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

/** Барлығына көрінетін «QR код» батырмасы. */
export function QrButton({ m, actions, className = '' }: { m: Material; actions: MaterialActions; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        actions.onQr(m);
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-xs font-bold text-gold-200 transition hover:border-gold-400/60 hover:bg-gold-400/20 ${className}`}
      title="QR кодты ашу"
    >
      <LuQrCode className="size-3.5" />
      QR код
    </button>
  );
}

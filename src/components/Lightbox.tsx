import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import type { Material } from '../types';

interface Props {
  items: Material[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

export default function Lightbox({ items, index, onIndex, onClose }: Props) {
  const m = items[index];
  const touchX = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const count = items.length;

  const go = (d: number) => {
    if (count < 2) return;
    setLoaded(false);
    onIndex((index + d + count) % count);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  });

  // Келесі суретті алдын ала жүктеу
  useEffect(() => {
    if (count > 1) {
      const next = new Image();
      next.src = items[(index + 1) % count].file_url;
    }
  }, [index, count, items]);

  if (!m) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-ink-950/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={m.title}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 tabular-nums">
          {index + 1} / {count}
        </span>
        <button type="button" className="icon-btn !size-11 bg-white/5" onClick={onClose} aria-label="Жабу">
          <LuX className="size-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {!loaded && <span className="absolute size-10 animate-spin rounded-full border-4 border-white/10 border-t-gold-400" />}
        <img
          key={m.id}
          src={m.file_url}
          alt={m.title}
          onLoad={() => setLoaded(true)}
          className={`max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-black/60 transition duration-300 select-none ${loaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          draggable={false}
        />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-2 grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-gold-400 hover:text-ink-950 sm:left-5 sm:size-14" aria-label="Алдыңғы сурет">
              <LuChevronLeft className="size-7" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-2 grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-gold-400 hover:text-ink-950 sm:right-5 sm:size-14" aria-label="Келесі сурет">
              <LuChevronRight className="size-7" />
            </button>
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 py-4 text-center sm:py-6">
        <h2 className="font-display text-base font-semibold text-white sm:text-lg">{m.title}</h2>
        {m.description && <p className="scrollbar-thin mt-1.5 max-h-24 overflow-y-auto text-sm leading-relaxed text-slate-300">{m.description}</p>}
      </div>
    </div>,
    document.body,
  );
}

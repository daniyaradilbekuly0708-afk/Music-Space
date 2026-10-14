import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  bare?: boolean;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, children, size = 'md', closable = true, bare = false }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const root = panel.current;
      const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>('input, textarea, button');
      first?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [open, closable, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-md" onClick={() => closable && onClose()} />
      <div
        ref={panel}
        className={`relative w-full ${SIZES[size]} animate-pop ${
          bare
            ? ''
            : 'scrollbar-thin max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 shadow-2xl shadow-black/60 sm:rounded-3xl'
        }`}
      >
        {!bare && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-ink-800/90 px-5 py-4 backdrop-blur sm:px-6">
            <h2 className="font-display text-base font-semibold tracking-wide text-white sm:text-lg">{title}</h2>
            {closable && (
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Жабу">
                <LuX className="size-5" />
              </button>
            )}
          </div>
        )}
        {bare ? children : <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>}
      </div>
    </div>,
    document.body,
  );
}

import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const STYLE: Record<ToastKind, { icon: typeof LuInfo; cls: string }> = {
  success: { icon: LuCircleCheck, cls: 'text-emerald-300' },
  error: { icon: LuCircleAlert, cls: 'text-rose-300' },
  info: { icon: LuInfo, cls: 'text-gold-300' },
};

export default function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end" aria-live="polite">
      {toasts.map((t) => {
        const { icon: Icon, cls } = STYLE[t.kind];
        return (
          <div key={t.id} className="glass pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl bg-ink-800/90 px-4 py-3 shadow-xl shadow-black/40">
            <Icon className={`mt-0.5 size-5 shrink-0 ${cls}`} />
            <p className="flex-1 text-sm leading-relaxed text-slate-100">{t.text}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="-mr-1 rounded-full p-1 text-slate-400 hover:text-white" aria-label="Жабу">
              <LuX className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

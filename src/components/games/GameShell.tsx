import type { ReactNode } from 'react';
import { LuArrowLeft } from 'react-icons/lu';

interface Props {
  title: string;
  subtitle: string;
  progress?: { current: number; total: number };
  score?: number;
  onBack: () => void;
  children: ReactNode;
}

export default function GameShell({ title, subtitle, progress, score, onBack, children }: Props) {
  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  return (
    <div className="glass animate-fade-up rounded-3xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-ghost !px-3.5" onClick={onBack}>
          <LuArrowLeft className="size-4" />
          Ойындар
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-white sm:text-lg">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        {score !== undefined && (
          <span className="rounded-full bg-gold-400/15 px-3 py-1 font-display text-sm font-semibold text-gold-200 tabular-nums ring-1 ring-gold-400/30">
            {score} ұпай
          </span>
        )}
      </div>
      {progress && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-400 tabular-nums">
            <span>
              {Math.min(progress.current + 1, progress.total)} / {progress.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-plum-500 to-gold-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function ResultScreen({ score, total, onRetry, onBack }: { score: number; total: number; onRetry: () => void; onBack: () => void }) {
  const ratio = total ? score / total : 0;
  const msg = ratio === 1 ? 'Керемет! Барлығы дұрыс!' : ratio >= 0.7 ? 'Өте жақсы нәтиже!' : ratio >= 0.4 ? 'Жақсы! Тағы бір рет байқап көр.' : 'Қайталап көрейік, сен міндетті түрде үйренесің!';
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="relative mb-5">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/20 [animation-duration:2s]" />
        <div className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 font-display text-2xl font-bold text-ink-950 shadow-2xl shadow-gold-600/30 tabular-nums">
          {score}/{total}
        </div>
      </div>
      <h4 className="font-display text-xl font-semibold text-white">{msg}</h4>
      <p className="mt-2 text-sm text-slate-400">
        Сен {total} тапсырманың {score}-ін дұрыс орындадың.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-ghost" onClick={onBack}>
          Басқа ойын
        </button>
        <button type="button" className="btn-gold" onClick={onRetry} data-autofocus>
          Қайта ойнау
        </button>
      </div>
    </div>
  );
}

import { LuAtom, LuMusic } from 'react-icons/lu';
import type { Subject } from '../types';

export const SUBJECTS: { id: Subject; label: string; text: string; icon: typeof LuMusic }[] = [
  { id: 'music', label: 'Музыка', text: 'Әуендер, аспаптар, композиторлар және музыкалық ойындар', icon: LuMusic },
  { id: 'physics', label: 'Физика', text: 'Табиғат құбылыстары, тәжірибелер және интерактивті симуляциялар', icon: LuAtom },
];

/** «Музыка» / «Физика» бөлімдерін ауыстыратын үлкен батырмалар. */
export default function SubjectSwitch({ active, onChange, counts }: { active: Subject; onChange: (s: Subject) => void; counts: Record<Subject, number> }) {
  return (
    <div role="tablist" aria-label="Пән бөлімдері" className="grid gap-3 sm:grid-cols-2">
      {SUBJECTS.map(({ id, label, text, icon: Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl p-4 text-left transition sm:p-5 ${
              on
                ? 'bg-gradient-to-br from-plum-500/90 to-plum-700 shadow-xl shadow-plum-900/40 ring-1 ring-gold-300/40'
                : 'glass hover:-translate-y-0.5 hover:border-white/20'
            }`}
          >
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ring-1 transition ${on ? 'bg-ink-950/30 ring-white/20' : 'bg-white/5 ring-white/10 group-hover:bg-white/10'}`}>
              <Icon className={`size-7 ${on ? 'text-gold-300' : 'text-plum-300'}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-white sm:text-xl">{label}</span>
                <span className={`rounded-full px-2 text-[11px] leading-5 font-bold tabular-nums ${on ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'}`}>{counts[id]}</span>
              </span>
              <span className={`mt-0.5 block text-[13px] leading-snug ${on ? 'text-white/85' : 'text-slate-400'}`}>{text}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

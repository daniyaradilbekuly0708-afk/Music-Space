import { LuHeadphones, LuImages, LuMonitorPlay } from 'react-icons/lu';
import type { MaterialType } from '../types';

const TABS: { id: MaterialType; label: string; icon: typeof LuHeadphones }[] = [
  { id: 'audio', label: 'Аудио', icon: LuHeadphones },
  { id: 'video', label: 'Видео', icon: LuMonitorPlay },
  { id: 'image', label: 'Суреттер', icon: LuImages },
];

export default function Tabs({ active, onChange, counts }: { active: MaterialType; onChange: (t: MaterialType) => void; counts: Record<MaterialType, number> }) {
  return (
    <div role="tablist" aria-label="Бөлімдер" className="glass grid w-full grid-cols-3 gap-1 rounded-2xl p-1.5 sm:inline-grid sm:w-auto">
      {TABS.map(({ id, label, icon: Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 sm:gap-2 text-sm font-bold transition sm:px-6 ${
              on ? 'bg-gradient-to-br from-plum-500 to-plum-700 text-white shadow-lg shadow-plum-900/50' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className={`hidden size-[18px] min-[420px]:block ${on ? 'text-gold-300' : ''}`} />
            <span>{label}</span>
            <span className={`rounded-full px-1.5 text-[11px] leading-5 font-bold ${on ? 'bg-white/15 text-gold-200' : 'bg-white/[0.06] text-slate-400'}`}>{counts[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

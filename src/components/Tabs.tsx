import { LuFlaskConical, LuGamepad2, LuHeadphones, LuImages, LuMonitorPlay } from 'react-icons/lu';
import type { MaterialType, Subject } from '../types';

export type SectionId = MaterialType | 'games';

const TABS: { id: SectionId; label: string; icon: typeof LuHeadphones }[] = [
  { id: 'audio', label: 'Аудио', icon: LuHeadphones },
  { id: 'video', label: 'Видео', icon: LuMonitorPlay },
  { id: 'image', label: 'Суреттер', icon: LuImages },
  { id: 'games', label: 'Ойындар', icon: LuGamepad2 },
];

export default function Tabs({ active, onChange, counts, subject }: { active: SectionId; onChange: (t: SectionId) => void; counts: Record<MaterialType, number>; subject: Subject }) {
  const tabs = TABS.map((t) => (t.id === 'games' && subject === 'physics' ? { ...t, label: 'Тәжірибелер', icon: LuFlaskConical } : t));
  return (
    <div role="tablist" aria-label="Бөлімдер" className="glass grid w-full grid-cols-2 gap-1 min-[520px]:grid-cols-4 rounded-2xl p-1.5 sm:inline-grid sm:w-auto">
      {tabs.map(({ id, label, icon: Icon }) => {
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
            <Icon className={`hidden size-[18px] min-[360px]:block ${on ? 'text-gold-300' : ''}`} />
            <span>{label}</span>
            {id !== 'games' && (
              <span className={`rounded-full px-1.5 text-[11px] leading-5 font-bold ${on ? 'bg-white/15 text-gold-200' : 'bg-white/[0.06] text-slate-400'}`}>{counts[id]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

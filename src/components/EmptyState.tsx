import { LuHeadphones, LuImages, LuMonitorPlay, LuSearch } from 'react-icons/lu';
import type { MaterialType } from '../types';

const COPY: Record<MaterialType, { title: string; icon: typeof LuHeadphones }> = {
  audio: { title: 'Әзірге аудио жоқ', icon: LuHeadphones },
  video: { title: 'Әзірге видео жоқ', icon: LuMonitorPlay },
  image: { title: 'Әзірге суреттер жоқ', icon: LuImages },
};

export default function EmptyState({ type, searching, teacher, onUpload }: { type: MaterialType; searching: boolean; teacher: boolean; onUpload: () => void }) {
  const { title, icon: Icon } = searching ? { title: 'Ештеңе табылмады', icon: LuSearch } : COPY[type];
  return (
    <div className="glass mx-auto flex max-w-lg animate-fade-up flex-col items-center rounded-3xl px-6 py-14 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-glow rounded-full bg-plum-500/30 blur-2xl" />
        <div className="relative grid size-20 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900">
          <Icon className="size-9 text-gold-300" />
        </div>
        <span className="absolute -top-2 -right-3 animate-bounce font-display text-xl text-plum-300">♪</span>
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        {searching
          ? 'Басқа сөзбен іздеп көріңіз немесе іздеу жолын тазалаңыз.'
          : teacher
            ? 'Алғашқы материалды жүктеп, оқушыларыңызбен бөлісіңіз.'
            : 'Мұғалім материал жүктегенде, олар осы жерде пайда болады.'}
      </p>
      {teacher && !searching && (
        <button type="button" className="btn-gold mt-6" onClick={onUpload}>
          Материал жүктеу
        </button>
      )}
    </div>
  );
}

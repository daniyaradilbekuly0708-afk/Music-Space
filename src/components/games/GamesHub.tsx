import { useEffect, useState } from 'react';
import { LuBrain, LuCloudLightning, LuEar, LuGuitar, LuPuzzle, LuRainbow, LuSnowflake, LuZap } from 'react-icons/lu';
import SoundGame from './SoundGame';
import MatchGame from './MatchGame';
import QuizGame from './QuizGame';
import WeatherGame from './WeatherGame';
import DombraGame from './DombraGame';
import RainbowSim from './RainbowSim';
import LightningSim from './LightningSim';
import SnowSim from './SnowSim';
import { MATCH_PAIRS, QUIZ, SOUND_ITEMS } from '../../lib/gamesData';
import type { Subject } from '../../types';

type GameId = 'weather' | 'rainbow' | 'lightning' | 'snow' | 'dombra' | 'sound' | 'match' | 'quiz';

const GAMES: { id: GameId; subject: Subject; title: string; text: string; meta: string; icon: typeof LuEar }[] = [
  { id: 'weather', subject: 'music', title: 'Ауа райы саяхаты', text: 'Анимациялық ойын: аспаннан түскен ноталарды ұстап, әуен құра, найзағайдан қаш!', meta: '3 кезең · 60 секунд', icon: LuCloudLightning },
  { id: 'rainbow', subject: 'physics', title: 'Кемпірқосақ симуляциясы', text: 'Интерактивті модель: күннің биіктігін, тамшыны және жаңбырды өзгертіп, кемпірқосақтың пайда болуын бақыла.', meta: 'сыну, шағылу, дисперсия', icon: LuRainbow },
  { id: 'lightning', subject: 'physics', title: 'Найзағай симуляциясы', text: 'Бұлттағы зарядтарды бөліп, найзағайды іске қос және күн күркіреуінің қанша секундта жететінін есепте.', meta: 'заряд, разряд, дыбыс жылдамдығы', icon: LuZap },
  { id: 'snow', subject: 'physics', title: 'Қар ұшқыны симуляциясы', text: 'Температура, жел және ылғалдылықты өзгертіп, су буының мұз кристалына айналуын бақыла.', meta: 'десублимация, ауырлық күші', icon: LuSnowflake },
  { id: 'dombra', subject: 'music', title: 'Домбыра шерт', text: 'Екі шекті домбырада өзің ойна немесе жаттығуларды қадаммен үйрен.', meta: 'Еркін ойнау · 5 жаттығу', icon: LuGuitar },
  { id: 'sound', subject: 'music', title: 'Дыбысынан таны', text: 'Жаңбыр, найзағай, боран… Дыбысты тыңдап, қай құбылыс екенін тап.', meta: `${SOUND_ITEMS.length} дыбыс`, icon: LuEar },
  { id: 'match', subject: 'music', title: 'Сәйкестендір', text: 'Табиғат құбылысын оны суреттейтін музыкалық шығармамен жұпта.', meta: `${MATCH_PAIRS.length} жұп`, icon: LuPuzzle },
  { id: 'quiz', subject: 'physics', title: 'Құбылыс викторинасы', text: 'Найзағай, қар, кемпірқосақ және композиторлар туралы сұрақтар.', meta: `${QUIZ.length} сұрақ`, icon: LuBrain },
];

export default function GamesHub({ subject }: { subject: Subject }) {
  const [game, setGame] = useState<GameId | null>(null);
  // Бөлім ауысқанда ашық ойыннан тізімге қайтамыз
  useEffect(() => setGame(null), [subject]);
  const back = () => setGame(null);

  if (game === 'weather') return <WeatherGame onBack={back} />;
  if (game === 'rainbow') return <RainbowSim onBack={back} />;
  if (game === 'lightning') return <LightningSim onBack={back} />;
  if (game === 'snow') return <SnowSim onBack={back} />;
  if (game === 'dombra') return <DombraGame onBack={back} />;
  if (game === 'sound') return <SoundGame onBack={back} />;
  if (game === 'match') return <MatchGame onBack={back} />;
  if (game === 'quiz') return <QuizGame onBack={back} />;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {GAMES.filter((g) => g.subject === subject).map(({ id, title, text, meta, icon: Icon }, i) => (
        <button
          key={id}
          type="button"
          onClick={() => setGame(id)}
          className="group glass relative flex animate-fade-up flex-col overflow-hidden rounded-3xl p-6 text-left shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-gold-400/30"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-plum-500/25 blur-3xl transition-opacity group-hover:opacity-100" />
          <div className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-plum-500 to-ink-600 ring-1 ring-white/15 transition group-hover:scale-105">
            <Icon className="size-7 text-gold-300" />
          </div>
          <h3 className="relative font-display text-lg font-semibold text-white">{title}</h3>
          <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-300/85">{text}</p>
          <div className="relative mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{meta}</span>
            <span className="btn-gold !px-4 !py-2 !text-xs">{subject === 'physics' ? 'Бастау' : 'Ойнау'}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

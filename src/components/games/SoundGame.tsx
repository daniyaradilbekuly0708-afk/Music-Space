import { useEffect, useMemo, useState } from 'react';
import { LuBird, LuCircleCheck, LuCircleX, LuCloudLightning, LuCloudRain, LuArrowRight, LuSnowflake, LuVolume2, LuWaves, LuWind } from 'react-icons/lu';
import GameShell, { ResultScreen } from './GameShell';
import { SOUND_ITEMS, shuffle, type SoundItem } from '../../lib/gamesData';
import { playNature, stopNature, type NatureSound } from '../../lib/natureSounds';
import { Equalizer } from '../SoundWave';

const ICONS: Record<NatureSound, typeof LuCloudRain> = {
  rain: LuCloudRain,
  thunder: LuCloudLightning,
  wind: LuWind,
  blizzard: LuSnowflake,
  birds: LuBird,
  waves: LuWaves,
};

interface Round {
  answer: SoundItem;
  options: SoundItem[];
}

function makeRounds(): Round[] {
  return shuffle(SOUND_ITEMS).map((answer) => ({
    answer,
    options: shuffle([answer, ...shuffle(SOUND_ITEMS.filter((s) => s.id !== answer.id)).slice(0, 3)]),
  }));
}

export default function SoundGame({ onBack }: { onBack: () => void }) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => makeRounds(), [seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<NatureSound | null>(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const done = i >= rounds.length;
  const round = rounds[i];

  useEffect(() => () => stopNature(), []);

  const play = () => {
    if (!round) return;
    playNature(round.answer.id, 5);
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 5200);
  };

  const choose = (id: NatureSound) => {
    if (picked) return;
    setPicked(id);
    if (id === round.answer.id) setScore((s) => s + 1);
  };

  const next = () => {
    stopNature();
    setPlaying(false);
    setPicked(null);
    setI((x) => x + 1);
  };

  const restart = () => {
    stopNature();
    setSeed((s) => s + 1);
    setI(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <GameShell title="Дыбысынан таны" subtitle="Дыбысты тыңдап, қай табиғат құбылысы екенін тап" progress={done ? undefined : { current: i, total: rounds.length }} score={score} onBack={onBack}>
      {done ? (
        <ResultScreen score={score} total={rounds.length} onRetry={restart} onBack={onBack} />
      ) : (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={play}
            className="relative grid size-28 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-2xl shadow-gold-600/30 transition hover:scale-105 active:scale-95"
            aria-label="Дыбысты тыңдау"
          >
            {playing && <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/30 [animation-duration:1.6s]" />}
            <LuVolume2 className="relative size-11" />
          </button>
          <p className="mt-4 flex h-5 items-center gap-2 text-sm font-semibold text-slate-300">
            {playing ? (
              <>
                <Equalizer active bars={6} /> Тыңдап тұр…
              </>
            ) : picked ? (
              'Қайта тыңдағың келсе, батырманы бас'
            ) : (
              'Батырманы басып, тыңда'
            )}
          </p>

          <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-3">
            {round.options.map((o) => {
              const Icon = ICONS[o.id];
              const isAnswer = o.id === round.answer.id;
              const state = !picked ? 'idle' : isAnswer ? 'right' : picked === o.id ? 'wrong' : 'dim';
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o.id)}
                  disabled={Boolean(picked)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-5 text-sm font-bold transition ${
                    state === 'idle'
                      ? 'border-white/10 bg-white/[0.04] text-white hover:-translate-y-0.5 hover:border-plum-400/60 hover:bg-plum-500/10'
                      : state === 'right'
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                        : state === 'wrong'
                          ? 'animate-pop border-rose-400/60 bg-rose-500/15 text-rose-100'
                          : 'border-white/5 bg-white/[0.02] text-slate-500'
                  }`}
                >
                  <Icon className="size-8" />
                  {o.label}
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="mt-6 flex w-full max-w-xl animate-fade-up flex-col items-center gap-4 text-center">
              <p className={`flex items-start gap-2 text-sm leading-relaxed ${picked === round.answer.id ? 'text-emerald-200' : 'text-rose-200'}`}>
                {picked === round.answer.id ? <LuCircleCheck className="mt-0.5 size-5 shrink-0" /> : <LuCircleX className="mt-0.5 size-5 shrink-0" />}
                <span>
                  {picked === round.answer.id ? 'Дұрыс! ' : `Бұл — ${round.answer.label}. `}
                  <span className="text-slate-300">{round.answer.hint}</span>
                </span>
              </p>
              <button type="button" className="btn-gold" onClick={next} data-autofocus>
                {i + 1 < rounds.length ? 'Келесі дыбыс' : 'Нәтижені көру'}
                <LuArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}

import { useMemo, useState } from 'react';
import { LuArrowRight, LuCircleCheck, LuCircleX } from 'react-icons/lu';
import GameShell, { ResultScreen } from './GameShell';
import { QUIZ, shuffle } from '../../lib/gamesData';

export default function QuizGame({ onBack }: { onBack: () => void }) {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () =>
      shuffle(QUIZ).map((q) => {
        const order = shuffle(q.options.map((_, idx) => idx));
        return { ...q, options: order.map((k) => q.options[k]), answer: order.indexOf(q.answer) };
      }),
    [seed],
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= questions.length;
  const q = questions[i];

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setScore((s) => s + 1);
  };

  const restart = () => {
    setSeed((s) => s + 1);
    setI(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <GameShell title="Құбылыс викторинасы" subtitle="Найзағай, қар, кемпірқосақ және музыка туралы сұрақтар" progress={done ? undefined : { current: i, total: questions.length }} score={score} onBack={onBack}>
      {done ? (
        <ResultScreen score={score} total={questions.length} onRetry={restart} onBack={onBack} />
      ) : (
        <div className="mx-auto max-w-2xl">
          <h4 className="text-center font-display text-lg leading-snug font-semibold text-balance text-white sm:text-xl">{q.q}</h4>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const state = picked === null ? 'idle' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={o}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => choose(k)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                    state === 'idle'
                      ? 'border-white/10 bg-white/[0.04] text-white hover:-translate-y-0.5 hover:border-plum-400/60 hover:bg-plum-500/10'
                      : state === 'right'
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                        : state === 'wrong'
                          ? 'animate-pop border-rose-400/60 bg-rose-500/15 text-rose-100'
                          : 'border-white/5 bg-white/[0.02] text-slate-500'
                  }`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">{'АӘБВ'[k]}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-6 flex animate-fade-up flex-col items-center gap-4 text-center">
              <p className={`flex items-start gap-2 text-sm leading-relaxed ${picked === q.answer ? 'text-emerald-200' : 'text-rose-200'}`}>
                {picked === q.answer ? <LuCircleCheck className="mt-0.5 size-5 shrink-0" /> : <LuCircleX className="mt-0.5 size-5 shrink-0" />}
                <span>
                  {picked === q.answer ? 'Дұрыс! ' : 'Қате. '}
                  <span className="text-slate-300">{q.explain}</span>
                </span>
              </p>
              <button
                type="button"
                className="btn-gold"
                data-autofocus
                onClick={() => {
                  setPicked(null);
                  setI((x) => x + 1);
                }}
              >
                {i + 1 < questions.length ? 'Келесі сұрақ' : 'Нәтижені көру'}
                <LuArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}

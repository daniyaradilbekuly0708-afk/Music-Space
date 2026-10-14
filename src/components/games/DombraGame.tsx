import { useEffect, useRef, useState } from 'react';
import { LuArrowLeft, LuCircleCheck, LuRotateCcw } from 'react-icons/lu';
import { playPluck } from '../../lib/natureSounds';

/**
 * «Домбыра шерт» — екі шекті домбырада ойнау.
 * Күйі: төменгі шек — Ре (D3), жоғарғы шек — Соль (G3) (кварталық күй).
 * Пернелер екі шекке ортақ: 0, 2, 4, 5, 7, 9, 10, 12 жартылай тон.
 */

const FRETS = [0, 2, 4, 5, 7, 9, 10, 12];
type StringId = 'top' | 'bottom';
const STRINGS: Record<StringId, { label: string; base: number; names: string[] }> = {
  top: { label: 'Жоғарғы шек (Соль)', base: 196.0, names: ['Соль', 'Ля', 'Си', 'До', 'Ре', 'Ми', 'Фа', 'Соль'] },
  bottom: { label: 'Төменгі шек (Ре)', base: 146.83, names: ['Ре', 'Ми', 'Фа♯', 'Соль', 'Ля', 'Си', 'До', 'Ре'] },
};
const freqOf = (s: StringId, k: number) => STRINGS[s].base * Math.pow(2, FRETS[k] / 12);

type Step = { s: StringId; k: number } | { strum: [number, number] };
interface Lesson {
  id: string;
  title: string;
  text: string;
  steps: Step[];
}

const LESSONS: Lesson[] = [
  { id: 'open', title: 'Ашық шектер', text: 'Пернені баспай, екі шекті кезекпен шерт: Ре — Соль.', steps: [0, 1, 2, 3].flatMap(() => [{ s: 'bottom', k: 0 }, { s: 'top', k: 0 }] as Step[]) },
  { id: 'up', title: 'Гамма — жоғары', text: 'Төменгі шекте пернелерді ретімен жоғары басып шық.', steps: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ s: 'bottom', k }) as Step) },
  { id: 'down', title: 'Гамма — төмен', text: 'Жоғарғы шекте пернелерді жоғарыдан төмен қарай бас.', steps: [7, 6, 5, 4, 3, 2, 1, 0].map((k) => ({ s: 'top', k }) as Step) },
  {
    id: 'pattern',
    title: 'Әуенді жаттығу',
    text: 'Екі шекте кезектесіп ойнайтын шағын жаттығу әуен.',
    steps: [
      { s: 'bottom', k: 0 },
      { s: 'bottom', k: 2 },
      { s: 'top', k: 0 },
      { s: 'top', k: 2 },
      { s: 'top', k: 1 },
      { s: 'top', k: 0 },
      { s: 'bottom', k: 2 },
      { s: 'bottom', k: 0 },
    ],
  },
  { id: 'strum', title: 'Қағыс', text: '«Қағу» батырмасымен екі шекті бірге қағып көр (4 рет).', steps: [0, 1, 2, 3].map(() => ({ strum: [0, 0] as [number, number] })) },
];

const KEY_TOP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];
const KEY_BOTTOM = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

export default function DombraGame({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'free' | 'learn'>('free');
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [pos, setPos] = useState(0);
  const [held, setHeld] = useState<{ top: number; bottom: number }>({ top: 0, bottom: 0 });
  const [vibe, setVibe] = useState<{ top: number; bottom: number }>({ top: 0, bottom: 0 });
  const [last, setLast] = useState<string>('');
  const [miss, setMiss] = useState(false);
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const step = mode === 'learn' ? lesson.steps[pos] : undefined;
  const lessonDone = mode === 'learn' && pos >= lesson.steps.length;
  const stateRef = useRef({ mode, step, pos, lesson });
  stateRef.current = { mode, step, pos, lesson };

  const advance = (ok: boolean) => {
    if (stateRef.current.mode !== 'learn') return;
    if (ok) {
      setPos((p) => p + 1);
      setMiss(false);
    } else {
      setMiss(true);
      window.setTimeout(() => setMiss(false), 500);
    }
  };

  const pluck = (s: StringId, k: number) => {
    playPluck(freqOf(s, k));
    setHeld((h) => ({ ...h, [s]: k }));
    setVibe((v) => ({ ...v, [s]: v[s] + 1 }));
    setLast(`${STRINGS[s].names[k]} (${s === 'top' ? 'жоғарғы' : 'төменгі'} шек, ${k === 0 ? 'ашық' : `${k}-перне`})`);
    const st = stateRef.current.step;
    if (st) advance('s' in st && st.s === s && st.k === k);
  };

  const strum = () => {
    playPluck(freqOf('bottom', held.bottom), 0.75);
    window.setTimeout(() => playPluck(freqOf('top', held.top), 0.75), 28);
    setVibe((v) => ({ top: v.top + 1, bottom: v.bottom + 1 }));
    setLast(`Қағыс: ${STRINGS.bottom.names[held.bottom]} + ${STRINGS.top.names[held.top]}`);
    const st = stateRef.current.step;
    if (st) advance('strum' in st);
  };

  // Пернетақтадан ойнау
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      const t = KEY_TOP.indexOf(k);
      const b = KEY_BOTTOM.indexOf(k);
      if (t >= 0) pluck('top', t);
      else if (b >= 0) pluck('bottom', b);
      else if (k === ' ') {
        e.preventDefault();
        strum();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const startLesson = (id: string) => {
    setLessonId(id);
    setPos(0);
    setMode('learn');
    setHeld({ top: 0, bottom: 0 });
  };

  // SVG геометриясы
  const NUT = 70;
  const NECK_END = 640;
  // Нақты пернелер арақашықтығы: 12-перне мойынның соңында
  const fretX = (semi: number) => NUT + ((NECK_END - NUT) * (1 - Math.pow(2, -semi / 12))) / 0.5;
  const yTop = 110;
  const yBottom = 140;
  const targetKey = (s: StringId, k: number) => !!step && 's' in step && step.s === s && step.k === k;

  return (
    <div className="glass animate-fade-up overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <button type="button" className="btn-ghost !px-3.5" onClick={onBack}>
          <LuArrowLeft className="size-4" />
          Ойындар
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-white sm:text-lg">Домбыра шерт</h3>
          <p className="text-xs text-slate-400">Екі шекті домбыра · күйі: Ре — Соль</p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1" role="tablist">
          {(
            [
              ['free', 'Еркін ойнау'],
              ['learn', 'Үйрену'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => (id === 'learn' ? startLesson(lessonId) : setMode('free'))}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${mode === id ? 'bg-white text-ink-950' : 'text-slate-300 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Домбыраның суреті */}
      <div className="px-2 sm:px-5">
        <svg viewBox="0 0 1000 250" className="mx-auto block w-full max-w-5xl" role="img" aria-label="Домбыра">
          <defs>
            <linearGradient id="dbBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c47a3a" />
              <stop offset="0.55" stopColor="#8a4a1f" />
              <stop offset="1" stopColor="#5a2e12" />
            </linearGradient>
            <linearGradient id="dbNeck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a8622c" />
              <stop offset="1" stopColor="#6e3816" />
            </linearGradient>
            <radialGradient id="dbGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f7cf62" stopOpacity="0.35" />
              <stop offset="1" stopColor="#f7cf62" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* бас */}
          <path d="M20 100 Q8 125 20 150 L74 146 L74 104 Z" fill="url(#dbNeck)" />
          <circle cx="36" cy="96" r="7" fill="#e7c37a" />
          <circle cx="36" cy="154" r="7" fill="#e7c37a" />
          {/* мойын */}
          <rect x="70" y="102" width="600" height="46" rx="6" fill="url(#dbNeck)" />
          {/* шанақ */}
          <path d="M640 125 C 660 40, 820 18, 900 60 C 990 105, 990 145, 900 190 C 820 232, 660 210, 640 125 Z" fill="url(#dbBody)" />
          <ellipse cx="800" cy="125" rx="120" ry="70" fill="url(#dbGlow)" />
          {/* ою-өрнек */}
          <g fill="none" stroke="#f7cf62" strokeOpacity="0.55" strokeWidth="2">
            <path d="M760 125 q20 -30 40 0 q20 30 40 0" />
            <path d="M760 125 q20 30 40 0 q20 -30 40 0" />
            <circle cx="800" cy="125" r="44" strokeOpacity="0.3" />
          </g>
          {/* тиек */}
          <rect x="905" y="100" width="8" height="50" rx="2" fill="#e7c37a" />
          {/* пернелер */}
          {FRETS.slice(1).map((semi, i) => {
            const x = fretX(semi);
            return (
              <g key={semi}>
                <rect x={x - 2} y="100" width="4" height="50" rx="1" fill="#e9d8a6" opacity="0.9" />
                <text x={x - (x - fretX(FRETS[i])) / 2} y="92" textAnchor="middle" fontSize="13" fill="#b8a9e0" fontWeight="700">
                  {i + 1}
                </text>
              </g>
            );
          })}
          {/* шектер */}
          {(['top', 'bottom'] as StringId[]).map((s) => {
            const y = s === 'top' ? yTop : yBottom;
            const hx = held[s] === 0 ? NUT : fretX(FRETS[held[s]]) - 8;
            return (
              <g key={s}>
                <line key={`${s}-${vibe[s]}`} x1={NUT} y1={y} x2="909" y2={y} stroke="#fdf3d0" strokeWidth={s === 'bottom' ? 2.6 : 2} className={vibe[s] ? 'db-vibe' : ''} />
                {held[s] > 0 && <circle cx={hx} cy={y} r="9" fill="#f7cf62" stroke="#fff" strokeWidth="2" />}
              </g>
            );
          })}
          {/* келесі қадамның белгісі */}
          {step && 's' in step && (
            <circle
              cx={step.k === 0 ? 860 : fretX(FRETS[step.k]) - 18}
              cy={step.s === 'top' ? yTop : yBottom}
              r="13"
              fill="none"
              stroke="#4ade80"
              strokeWidth="3"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Ойнау батырмалары */}
      <div className="space-y-3 p-4 sm:p-5">
        {(['top', 'bottom'] as StringId[]).map((s) => (
          <div key={s}>
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.12em] text-plum-300 uppercase">{STRINGS[s].label}</p>
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {STRINGS[s].names.map((n, k) => {
                const target = targetKey(s, k);
                return (
                  <button
                    key={k}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      pluck(s, k);
                    }}
                    onKeyDown={(e) => (e.key === 'Enter' ? pluck(s, k) : undefined)}
                    className={`flex flex-col items-center rounded-xl border px-0.5 py-2.5 transition select-none active:scale-95 ${
                      target
                        ? 'border-emerald-400/80 bg-emerald-500/20 text-white shadow-[0_0_0_4px_rgb(74_222_128/0.15)]'
                        : held[s] === k
                          ? 'border-gold-400/60 bg-gold-400/15 text-gold-100'
                          : 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-plum-400/60 hover:bg-plum-500/10'
                    }`}
                    aria-label={`${STRINGS[s].label}: ${n}, ${k === 0 ? 'ашық шек' : `${k}-перне`}`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400">{k === 0 ? 'ашық' : k}</span>
                    <span className="text-xs font-bold sm:text-sm">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              strum();
            }}
            className={`btn-gold !px-6 !py-3 ${step && 'strum' in step ? 'ring-4 ring-emerald-400/40' : ''}`}
          >
            Қағу (екі шекті бірге)
          </button>
          <p className="min-w-0 flex-1 text-sm text-slate-300">{last ? <>Дыбыс: <b className="text-gold-200">{last}</b></> : 'Пернені бас — домбыра дыбысталады.'}</p>
        </div>
        <p className="hidden text-xs text-slate-500 sm:block">Пернетақта: жоғарғы шек — Q W E R T Y U I, төменгі шек — A S D F G H J K, қағу — бос орын (Space).</p>
      </div>

      {/* Үйрену режимі */}
      {mode === 'learn' && (
        <div className="border-t border-white/[0.06] p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {LESSONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => startLesson(l.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${l.id === lessonId ? 'bg-plum-500 text-white' : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'}`}
              >
                {l.title}
              </button>
            ))}
          </div>
          {lessonDone ? (
            <div className="flex animate-pop flex-wrap items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
              <LuCircleCheck className="size-6 text-emerald-300" />
              <p className="flex-1 text-sm font-semibold text-emerald-100">Жарайсың! «{lesson.title}» жаттығуы орындалды.</p>
              <button type="button" className="btn-ghost !py-1.5" onClick={() => startLesson(lesson.id)}>
                <LuRotateCcw className="size-4" /> Қайталау
              </button>
              {LESSONS.findIndex((l) => l.id === lesson.id) < LESSONS.length - 1 && (
                <button type="button" className="btn-gold !py-1.5" onClick={() => startLesson(LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1].id)}>
                  Келесі жаттығу
                </button>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border px-4 py-3 transition ${miss ? 'animate-pop border-rose-400/50 bg-rose-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
              <p className="text-sm text-slate-300">{lesson.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {lesson.steps.map((st, i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${i < pos ? 'bg-emerald-500/20 text-emerald-200' : i === pos ? 'bg-gold-400 text-ink-950' : 'bg-white/[0.06] text-slate-400'}`}
                  >
                    {'strum' in st ? 'Қағу' : STRINGS[st.s].names[st.k]}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {miss ? 'Басқа перне басылды — жасыл белгіні қара.' : 'Жасыл белгіленген пернені бас.'} {pos}/{lesson.steps.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

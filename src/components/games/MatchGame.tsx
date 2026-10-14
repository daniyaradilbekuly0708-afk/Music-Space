import { useMemo, useState } from 'react';
import { LuCircleCheck } from 'react-icons/lu';
import GameShell, { ResultScreen } from './GameShell';
import { MATCH_PAIRS, shuffle } from '../../lib/gamesData';

export default function MatchGame({ onBack }: { onBack: () => void }) {
  const [seed, setSeed] = useState(0);
  const left = useMemo(() => shuffle(MATCH_PAIRS), [seed]);
  const right = useMemo(() => shuffle(MATCH_PAIRS), [seed]);
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ l: string; r: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const done = matched.length === MATCH_PAIRS.length;
  const score = Math.max(0, MATCH_PAIRS.length - mistakes);

  const tryPair = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (l === r) {
      setMatched((m) => [...m, l]);
      const p = MATCH_PAIRS.find((x) => x.id === l);
      setLastNote(p ? `${p.nature} — ${p.music} (${p.composer}). ${p.note}` : null);
      setSelL(null);
      setSelR(null);
    } else {
      setWrong({ l, r });
      setMistakes((x) => x + 1);
      window.setTimeout(() => {
        setWrong(null);
        setSelL(null);
        setSelR(null);
      }, 700);
    }
  };

  const restart = () => {
    setSeed((s) => s + 1);
    setMatched([]);
    setMistakes(0);
    setSelL(null);
    setSelR(null);
    setLastNote(null);
  };

  const cls = (side: 'l' | 'r', id: string) => {
    const sel = side === 'l' ? selL : selR;
    if (matched.includes(id)) return 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100 cursor-default';
    if (wrong && wrong[side] === id) return 'animate-pop border-rose-400/60 bg-rose-500/15 text-rose-100';
    if (sel === id) return 'border-gold-400/70 bg-gold-400/15 text-white shadow-[0_0_0_4px_rgb(247_207_98/0.12)]';
    return 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-plum-400/60 hover:bg-plum-500/10';
  };

  return (
    <GameShell
      title="Сәйкестендір"
      subtitle="Табиғат құбылысын оны суреттейтін музыкамен жұпта"
      progress={done ? undefined : { current: matched.length, total: MATCH_PAIRS.length }}
      score={done ? score : undefined}
      onBack={onBack}
    >
      {done ? (
        <ResultScreen score={score} total={MATCH_PAIRS.length} onRetry={restart} onBack={onBack} />
      ) : (
        <>
          <p className="mb-4 text-center text-sm text-slate-400">Сол жақтан құбылысты, оң жақтан оған сай шығарманы таңда.</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-bold tracking-[0.12em] text-plum-300 uppercase">Табиғат</p>
              {left.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={matched.includes(p.id) || Boolean(wrong)}
                  onClick={() => {
                    setSelL(p.id);
                    tryPair(p.id, selR);
                  }}
                  className={`flex min-h-16 items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${cls('l', p.id)}`}
                >
                  {matched.includes(p.id) && <LuCircleCheck className="size-4 shrink-0" />}
                  {p.nature}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-bold tracking-[0.12em] text-gold-300 uppercase">Музыка</p>
              {right.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={matched.includes(p.id) || Boolean(wrong)}
                  onClick={() => {
                    setSelR(p.id);
                    tryPair(selL, p.id);
                  }}
                  className={`flex min-h-16 flex-col justify-center rounded-2xl border px-3 py-3 text-left transition ${cls('r', p.id)}`}
                >
                  <span className="text-sm leading-snug font-bold">{p.music}</span>
                  <span className="mt-0.5 text-xs font-medium opacity-70">{p.composer}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 min-h-10 text-center text-sm leading-relaxed text-emerald-200/90">{lastNote}</p>
          <p className="text-center text-xs text-slate-500 tabular-nums">Қателер: {mistakes}</p>
        </>
      )}
    </GameShell>
  );
}

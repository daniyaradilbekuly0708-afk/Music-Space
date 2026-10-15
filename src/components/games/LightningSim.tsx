import { useEffect, useRef, useState } from 'react';
import { LuCloudRain, LuRotateCcw, LuRuler, LuVolume2, LuZap } from 'react-icons/lu';
import GameShell from './GameShell';

const W = 700;
const H = 460;
const SOUND_SPEED = 343; // м/с
const DEFAULTS = { charge: 65, distance: 2, rain: 45 };
const START_STATUS = 'Бұлттың жоғарғы бөлігінде оң (+), төменгі бөлігінде теріс (−) зарядтар жиналады.';

type Pt = [number, number];

/** «Найзағайдың пайда болуы» — зарядтардың бөлінуі, разряд және күн күркіреуінің кешігуі. */
export default function LightningSim({ onBack }: { onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [charge, setCharge] = useState(DEFAULTS.charge);
  const [distance, setDistance] = useState(DEFAULTS.distance);
  const [rain, setRain] = useState(DEFAULTS.rain);
  const [status, setStatus] = useState(START_STATUS);
  const [flash, setFlash] = useState(0);
  const params = useRef({ charge, rain });
  params.current = { charge, rain };
  const bolt = useRef<{ path: Pt[]; until: number } | null>(null);
  const thunder = useRef<number | undefined>(undefined);
  const audio = useRef<AudioContext | null>(null);
  const delay = (distance * 1000) / SOUND_SPEED;

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    const drops = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 3 + Math.random() * 7 }));

    const cloud = (cx: number, cy: number, sc: number) => {
      ctx.fillStyle = '#66758e';
      for (const [a, b, rx, ry] of [[0, 0, 82, 42], [-63, 12, 62, 36], [65, 12, 68, 36], [-30, -23, 57, 45], [32, -28, 63, 48]]) {
        ctx.beginPath();
        ctx.ellipse(cx + a * sc, cy + b * sc, rx * sc, ry * sc, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    const draw = (t: number) => {
      const { charge: ch, rain: rn } = params.current;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#172b4f');
      g.addColorStop(0.73, '#3d587a');
      g.addColorStop(0.74, '#254a38');
      g.addColorStop(1, '#143321');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#355d41';
      ctx.beginPath();
      ctx.moveTo(0, 350);
      ctx.quadraticCurveTo(220, 305, 410, 350);
      ctx.quadraticCurveTo(550, 322, 700, 348);
      ctx.lineTo(700, 460);
      ctx.lineTo(0, 460);
      ctx.fill();
      cloud(350, 142, 1.35);

      // Зарядтар
      ctx.font = `bold 24px ${font}`;
      const n = Math.round(ch / 10);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = '#ffdf74';
        ctx.fillText('+', 210 + (i % 5) * 65, 89 + Math.floor(i / 5) * 20);
        ctx.fillStyle = '#8bd8ff';
        ctx.fillText('−', 212 + (i % 5) * 65, 180 + Math.floor(i / 5) * 22);
      }
      ctx.font = `600 17px ${font}`;
      ctx.fillStyle = '#ffdf74';
      ctx.fillText('Оң заряд (+)', 22, 48);
      ctx.fillStyle = '#8bd8ff';
      ctx.fillText('Теріс заряд (−)', 22, 76);

      // Жаңбыр
      const count = Math.floor(rn * 1.2);
      ctx.strokeStyle = '#9bc4e0a0';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        const d = drops[i];
        d.y = (d.y + d.s * 0.35) % H;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 5, d.y + 14);
        ctx.stroke();
      }

      // Найзағай
      const b = bolt.current;
      if (b && t < b.until) {
        ctx.strokeStyle = '#fffbe5';
        ctx.shadowColor = '#d6ecff';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;
        ctx.beginPath();
        b.path.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
        ctx.strokeStyle = '#9edaff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = '#eaf2ff';
      ctx.font = `16px ${font}`;
      ctx.fillText('Жер беті', 25, 430);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(thunder.current);
      audio.current?.close().catch(() => {});
    };
  }, []);

  const playThunder = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const a = (audio.current ??= new Ctx());
      const o = a.createOscillator();
      const gain = a.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(70, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(35, a.currentTime + 0.6);
      gain.gain.setValueAtTime(0.14, a.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.7);
      o.connect(gain);
      gain.connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.72);
    } catch {
      /* дыбыс қолжетімсіз */
    }
  };

  const fire = () => {
    window.clearTimeout(thunder.current);
    if (charge < 35) {
      setStatus('Зарядтардың бөлінуі төмен. Осы оқу моделінде разряд үшін көрсеткішті кемінде 35%-ға көтеріңіз.');
      return;
    }
    // Дыбыс контекстін пайдаланушы басқан сәтте ашамыз (браузер талабы)
    if (!audio.current) {
      try {
        audio.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        /* елемейміз */
      }
    }
    const path: Pt[] = [[355, 204]];
    let px = 355;
    let py = 204;
    while (py < 350) {
      px += (Math.random() - 0.5) * 76;
      py += 20 + Math.random() * 24;
      path.push([px, Math.min(py, 350)]);
    }
    bolt.current = { path, until: performance.now() + 360 };
    setFlash((f) => f + 1);
    setStatus(`Электрлік разряд! Жарық байқалды. Күн күркіреуі шамамен ${delay.toFixed(1)} секундтан кейін жетеді.`);
    thunder.current = window.setTimeout(() => {
      setStatus('Күн күркіреуі! Разряд кезінде ауа күрт қызады, ұлғайып, дыбыс толқынын тудырады.');
      playThunder();
    }, delay * 1000);
  };

  const reset = () => {
    window.clearTimeout(thunder.current);
    setCharge(DEFAULTS.charge);
    setDistance(DEFAULTS.distance);
    setRain(DEFAULTS.rain);
    bolt.current = null;
    setStatus(START_STATUS);
  };

  const sliders = [
    { id: 'lt-charge', label: 'Бұлттағы зарядтардың бөліну дәрежесі', icon: LuZap, value: charge, set: setCharge, min: 0, max: 100, step: 1, show: `${charge}%` },
    { id: 'lt-dist', label: 'Найзағайға дейінгі қашықтық', icon: LuRuler, value: distance, set: setDistance, min: 1, max: 10, step: 0.5, show: `${distance.toFixed(1)} км` },
    { id: 'lt-rain', label: 'Жауын-шашын қарқындылығы', icon: LuCloudRain, value: rain, set: setRain, min: 0, max: 100, step: 1, show: `${rain}%` },
  ];

  return (
    <GameShell title="Найзағай симуляциясы" subtitle="Физика · электр зарядтары, разряд және дыбыс жылдамдығы" onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative self-start overflow-hidden rounded-2xl ring-1 ring-white/10">
          <canvas ref={canvas} width={W} height={H} className="block h-auto w-full" role="img" aria-label="Бұлт, электр зарядтары және найзағай анимациясы" />
          {flash > 0 && <div key={flash} className="sim-flash pointer-events-none absolute inset-0 bg-white" aria-hidden="true" />}
        </div>
        <div className="flex flex-col gap-4">
          {sliders.map(({ id, label, icon: Icon, value, set, min, max, step, show }) => (
            <div key={id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <label htmlFor={id} className="mb-3 flex items-start gap-2 text-sm font-semibold text-slate-200">
                <Icon className="mt-0.5 size-4 shrink-0 text-gold-300" />
                <span className="flex-1">{label}</span>
                <span className="font-display text-gold-300 tabular-nums">{show}</span>
              </label>
              <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="ms-range" style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }} />
            </div>
          ))}
          <button type="button" className="btn-gold w-full" onClick={fire}>
            <LuZap className="size-4" />
            Найзағайды іске қосу
          </button>
          <button type="button" className="btn-ghost w-full" onClick={reset}>
            <LuRotateCcw className="size-4" />
            Бастапқы күйге қайтару
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-plum-500/10 p-4 text-sm leading-relaxed text-slate-100 ring-1 ring-plum-400/25" role="status">
          {status}
        </div>
        <div className="rounded-2xl bg-white/5 p-4 text-sm ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-slate-200">
            <LuVolume2 className="size-4 text-gold-300" />
            Күн күркіреуінің есептік кешігуі: <strong className="font-display text-gold-300 tabular-nums">{delay.toFixed(1)} с</strong>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Дыбыс жылдамдығы ≈ 343 м/с. Жарықтың жету уақыты ескерілмейді.</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] p-4">
        <p className="font-display text-sm font-semibold text-gold-200">Зерттеу сұрағы</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">
          Найзағайдан кейін күн күркіреуі 9 секундтан соң естілсе, найзағай шамамен қанша километр қашықтықта болған?
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Оқу моделі: заряд пайызы нақты электр өрісінің кернеулігін өлшемейді. Найзағайдың пайда болуы атмосферадағы күрделі электрлік процестерге
        тәуелді. Дыбыс кешігуі қашықтық бойынша есептеледі.
      </p>
    </GameShell>
  );
}

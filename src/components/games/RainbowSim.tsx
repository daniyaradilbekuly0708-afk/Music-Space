import { useEffect, useRef, useState } from 'react';
import { LuCloudRain, LuDroplet, LuPause, LuPlay, LuRotateCcw, LuSun } from 'react-icons/lu';
import GameShell from './GameShell';

const W = 1000;
const H = 530;
const COLORS = ['#ff3b30', '#ff9500', '#ffe63d', '#43dc69', '#34b9ff', '#4561ff', '#9a4bff'];
const DEFAULTS = { sun: 25, drop: 55, rain: 60 };

/**
 * «Кемпірқосақтың пайда болуы» — жарықтың сынуы, ішкі шағылуы және дисперсиясы
 * көрсетілетін интерактивті сызбалық модель.
 */
export default function RainbowSim({ onBack }: { onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sun, setSun] = useState(DEFAULTS.sun);
  const [drop, setDrop] = useState(DEFAULTS.drop);
  const [rain, setRain] = useState(DEFAULTS.rain);
  const [running, setRunning] = useState(true);
  const params = useRef({ sun, drop, rain, running });
  params.current = { sun, drop, rain, running };
  const t = useRef(0);
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';

    const line = (x1: number, y1: number, x2: number, y2: number, color: string, w = 3) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.stroke();
    };
    const text = (s: string, x: number, y: number, size = 19, color = '#fff') => {
      ctx.fillStyle = color;
      ctx.font = `bold ${size}px ${font}`;
      ctx.fillText(s, x, y);
    };

    const draw = () => {
      const { sun: angle, drop: r, rain: amount } = params.current;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#143c79');
      sky.addColorStop(1, '#b6e6fa');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Күн
      const sx = 125;
      const sy = 105 + angle * 0.75;
      ctx.fillStyle = '#ffdb60';
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#ffe37b';
      ctx.beginPath();
      ctx.arc(sx, sy, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      text('Күн', 85, sy - 52, 20);

      // Жаңбыр
      for (let i = 0; i < Math.round(amount * 1.5); i++) {
        const x = (i * 83.17 + 17) % W;
        const y = (i * 137.71 + t.current * 85 * ((i % 3) + 1)) % H;
        line(x, y, x - 8, y + 16, '#d8f4ff88', 1.6);
      }

      // Су тамшысы
      const dx = 490;
      const dy = 268;
      const g = ctx.createRadialGradient(dx - 20, dy - 25, 3, dx, dy, r);
      g.addColorStop(0, '#ffffffcc');
      g.addColorStop(0.65, '#8bd9f355');
      g.addColorStop(1, '#e7fbffdd');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#e8faff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      text('Су тамшысы', dx - 73, dy + r + 32, 19);

      // Сәуле жолы
      const entryX = dx - r * 0.82;
      const entryY = dy - r * 0.57;
      line(sx + 35, sy + 15, entryX, entryY, '#fff7c4', 5);
      text('Ақ жарық', 260, 155, 18, '#fffbd7');
      line(entryX, entryY, dx + 24, dy + 18, '#fff7c4', 4);
      line(dx + 24, dy + 18, dx + r * 0.5, dy - r * 0.55, '#fff7c4', 4);
      for (let i = 0; i < 7; i++) {
        const theta = -0.56 + i * 0.105;
        const ex = dx + r * 0.5;
        const ey = dy - r * 0.55;
        line(ex, ey, 810, ey + Math.tan(theta) * (810 - ex), COLORS[i], 4);
      }
      text('1. Сыну', dx - 137, dy - 10, 18);
      text('2. Ішкі шағылу', dx + r + 14, dy + 40, 17);
      text('3. Дисперсия', 695, 110, 19);

      // Кемпірқосақ доғасы
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(845, 510, 155 - i * 8, Math.PI, Math.PI * 2);
        ctx.strokeStyle = COLORS[i];
        ctx.lineWidth = 7;
        ctx.globalAlpha = 0.25 + amount / 145;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      text('Кемпірқосақ', 755, 350, 20);
      text('Бастапқы кемпірқосақ: ≈ 40–42°', 22, 500, 17);
    };
    redraw.current = draw;

    let raf = 0;
    const loop = () => {
      if (params.current.running) t.current += 0.018;
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const reset = () => {
    setSun(DEFAULTS.sun);
    setDrop(DEFAULTS.drop);
    setRain(DEFAULTS.rain);
  };

  const sliders = [
    { id: 'rb-sun', label: 'Күннің биіктігі', icon: LuSun, value: sun, set: setSun, min: 5, max: 50, show: `${sun}°` },
    { id: 'rb-drop', label: 'Тамшының өлшемі', icon: LuDroplet, value: drop, set: setDrop, min: 25, max: 85, show: String(drop) },
    { id: 'rb-rain', label: 'Жаңбыр қарқындылығы', icon: LuCloudRain, value: rain, set: setRain, min: 0, max: 100, show: `${rain}%` },
  ];

  return (
    <GameShell title="Кемпірқосақ симуляциясы" subtitle="Физика · жарықтың сынуы, дисперсиясы және ішкі шағылуы" onBack={onBack}>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          className="block h-auto w-full"
          role="img"
          aria-label="Күн сәулесі, су тамшысы және кемпірқосақтың интерактивті көрінісі"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {sliders.map(({ id, label, icon: Icon, value, set, min, max, show }) => (
          <div key={id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <label htmlFor={id} className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Icon className="size-4 text-gold-300" />
              <span className="flex-1">{label}</span>
              <span className="font-display text-gold-300 tabular-nums">{show}</span>
            </label>
            <input
              id={id}
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="ms-range"
              style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-gold" onClick={() => setRunning((r) => !r)}>
          {running ? <LuPause className="size-4" /> : <LuPlay className="size-4" />}
          {running ? 'Тоқтату' : 'Жалғастыру'}
        </button>
        <button type="button" className="btn-ghost" onClick={reset}>
          <LuRotateCcw className="size-4" />
          Бастапқы күй
        </button>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-slate-200" aria-live="polite">
        Күннің биіктігі: {sun}°. Су тамшысына түскен ақ жарық сынуға ұшырайды, тамшы ішінде шағылады және қайта шыққанда түстерге
        жіктеледі. Жаңбыр мөлшері: {rain}%. Күн төмен тұрған кезде кемпірқосақ көкжиектен биігірек көрінуі мүмкін.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Бұл — құбылысты түсіндіруге арналған сызбалық модель. Тамшы өлшемі кемпірқосақтың негізгі бұрышын тікелей өзгертпейді; ол
        көрінудің айқындылығына әсер етуі мүмкін. Нақты кемпірқосақ Күнге қарама-қарсы бағытта байқалады.
      </p>
    </GameShell>
  );
}

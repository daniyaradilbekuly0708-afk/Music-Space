import { useEffect, useRef, useState } from 'react';
import { LuCloud, LuDroplets, LuPause, LuPlay, LuRotateCcw, LuSnowflake, LuThermometer, LuWind } from 'react-icons/lu';
import GameShell from './GameShell';

const W = 900;
const H = 500;
const DEFAULTS = { temp: -10, wind: 2, humidity: 70 };

interface Flake {
  x: number;
  y: number;
  r: number;
  v: number;
  phase: number;
}

const seed = (): Flake[] =>
  Array.from({ length: 130 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 3 + Math.random() * 6, v: 0.45 + Math.random() * 1.2, phase: Math.random() * 7 }));

/** «Қар ұшқынының пайда болуы және қозғалысы» — десублимация, ауырлық күші, ауа кедергісі және жел. */
export default function SnowSim({ onBack }: { onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [temp, setTemp] = useState(DEFAULTS.temp);
  const [wind, setWind] = useState(DEFAULTS.wind);
  const [humidity, setHumidity] = useState(DEFAULTS.humidity);
  const [running, setRunning] = useState(true);
  const params = useRef({ temp, wind, humidity, running });
  params.current = { temp, wind, humidity, running };
  const flakes = useRef<Flake[]>(seed());
  const snow = temp <= 0;

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';

    const crystal = (a: number, b: number, r: number) => {
      ctx.save();
      ctx.translate(a, b);
      ctx.strokeStyle = 'rgba(255,255,255,.94)';
      ctx.lineWidth = 1.25;
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);
        ctx.moveTo(0, -r * 0.6);
        ctx.lineTo(-r * 0.27, -r * 0.78);
        ctx.moveTo(0, -r * 0.6);
        ctx.lineTo(r * 0.27, -r * 0.78);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    let raf = 0;
    const draw = () => {
      const { temp: t, wind: w, humidity: d, running: run } = params.current;
      const isSnow = t <= 0;
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#164a80');
      grad.addColorStop(0.77, '#83bee3');
      grad.addColorStop(0.78, '#eaf9ff');
      grad.addColorStop(1, '#fff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.ellipse(W * (0.17 + j * 0.34), H * 0.16, 65, 23, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const count = Math.floor(d * 1.3);
      for (const f of flakes.current.slice(0, count)) {
        if (isSnow) crystal(f.x, f.y, f.r);
        else {
          ctx.fillStyle = '#d7f5ff';
          ctx.beginPath();
          ctx.ellipse(f.x, f.y, 2, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (run) {
          f.y += f.v * (isSnow ? 1 : 2.5);
          f.x += w * 0.22 + Math.sin(f.y * 0.025 + f.phase) * 0.25;
          if (f.y > H * 0.82) {
            f.y = -10;
            f.x = Math.random() * W;
          }
          if (f.x > W + 10) f.x = -10;
          if (f.x < -10) f.x = W + 10;
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 17px ${font}`;
      ctx.fillText(isSnow ? 'Мұз кристалдары' : 'Су тамшылары', 18, 32);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const reset = () => {
    setTemp(DEFAULTS.temp);
    setWind(DEFAULTS.wind);
    setHumidity(DEFAULTS.humidity);
    flakes.current = seed();
    setRunning(true);
  };

  const sliders = [
    { id: 'sn-temp', label: 'Температура', icon: LuThermometer, value: temp, set: setTemp, min: -25, max: 10, show: `${temp > 0 ? '+' : temp < 0 ? '−' : ''}${Math.abs(temp)} °C` },
    { id: 'sn-wind', label: 'Жел', icon: LuWind, value: wind, set: setWind, min: -10, max: 10, show: `${wind} м/с` },
    { id: 'sn-hum', label: 'Ылғалдылық (шартты)', icon: LuCloud, value: humidity, set: setHumidity, min: 10, max: 100, show: `${humidity}%` },
  ];

  return (
    <GameShell title="Қар ұшқыны симуляциясы" subtitle="Физика · десублимация, ауырлық күші, ауа кедергісі және жел" onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="self-start overflow-hidden rounded-2xl ring-1 ring-white/10">
          <canvas ref={canvas} width={W} height={H} className="block h-auto w-full" role="img" aria-label="Қар ұшқындарының түзілуі мен қозғалысының анимациясы" />
        </div>
        <div className="flex flex-col gap-4">
          {sliders.map(({ id, label, icon: Icon, value, set, min, max, show }) => (
            <div key={id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <label htmlFor={id} className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Icon className="size-4 text-gold-300" />
                <span className="flex-1">{label}</span>
                <span className="font-display text-gold-300 tabular-nums">{show}</span>
              </label>
              <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="ms-range" style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }} />
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-gold flex-1" onClick={() => setRunning((r) => !r)}>
              {running ? <LuPause className="size-4" /> : <LuPlay className="size-4" />}
              {running ? 'Тоқтату' : 'Жалғастыру'}
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={reset}>
              <LuRotateCcw className="size-4" />
              Қайта бастау
            </button>
          </div>
          <div className="flex gap-3 rounded-2xl bg-plum-500/10 p-4 text-sm ring-1 ring-plum-400/25" role="status">
            {snow ? <LuSnowflake className="mt-0.5 size-5 shrink-0 text-plum-300" /> : <LuDroplets className="mt-0.5 size-5 shrink-0 text-plum-300" />}
            <div>
              <p className="font-semibold text-white">{snow ? 'Қар түзілуіне қолайлы жағдай' : 'Жылы ауа'}</p>
              <p className="mt-0.5 text-slate-300">
                {snow ? 'Су буы мұз кристалдарына айналуы мүмкін.' : 'Бұл қарапайым модельде қар орнына сұйық тамшылар көрсетіледі.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-slate-200 ring-1 ring-white/10">
        <span className="font-semibold text-white">Физикалық түсіндірме: </span>
        Бұлттағы су буы қолайлы жағдайда мұз кристалдарына тікелей айналады — бұл <b className="text-gold-200">десублимация</b>. Қар ұшқынына ауырлық
        күші төмен қарай, ауа кедергісі қозғалысына қарсы әсер етеді. Жел оның көлденең қозғалысын өзгертеді. Бұл — құбылыстарды түсіндіруге арналған
        сапалық модель, нақты ауа райы болжамы емес.
      </div>
    </GameShell>
  );
}

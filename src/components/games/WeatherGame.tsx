import { useCallback, useEffect, useRef, useState } from 'react';
import { LuArrowLeft, LuHeart, LuPause, LuPlay } from 'react-icons/lu';
import { playTone, playZap } from '../../lib/natureSounds';

/**
 * «Ауа райы саяхаты» — анимациялық ойын.
 * Аспаннан түскен ноталарды ұстау, найзағайдан қашу.
 * 3 кезең: жаңбыр → қар → найзағайлы дауыл. Соңында — кемпірқосақ.
 */

type Phase = 'intro' | 'playing' | 'paused' | 'over' | 'win';

const LEVEL_SECONDS = 20;
const LEVELS = [
  { name: 'Жаңбыр', sky: ['#1b2457', '#0b0f2e'], spawn: 0.95, bolt: 0.12, speed: 150 },
  { name: 'Қар', sky: ['#2b3170', '#121640'], spawn: 1.15, bolt: 0.2, speed: 175 },
  { name: 'Найзағайлы дауыл', sky: ['#24123f', '#07061a'], spawn: 1.35, bolt: 0.5, speed: 205 },
] as const;
const TOTAL = LEVEL_SECONDS * LEVELS.length;
// Қазақ әуендеріне жақын пентатоника: До, Ре, Ми, Соль, Ля
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

interface Item {
  kind: 'note' | 'bolt' | 'star';
  x: number;
  y: number;
  vy: number;
  r: number;
  wobble: number;
  glyph: string;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}
interface Burst {
  x: number;
  y: number;
  t: number;
  color: string;
  text: string;
}

export default function WeatherGame({ onBack }: { onBack: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 0, time: 0, best: 0 });
  const phaseRef = useRef<Phase>('intro');
  const raf = useRef(0);

  const g = useRef({
    w: 600,
    h: 440,
    dpr: 1,
    px: 300,
    tx: 300,
    items: [] as Item[],
    weather: [] as Particle[],
    bursts: [] as Burst[],
    score: 0,
    lives: 3,
    elapsed: 0,
    spawnAcc: 0,
    flash: 0,
    hurt: 0,
    noteIdx: 0,
    keys: { left: false, right: false },
    last: 0,
    rainbow: 0,
    combo: 0,
  });

  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const best = () => {
    try {
      return Number(localStorage.getItem('ms-weather-best') || 0);
    } catch {
      return 0;
    }
  };

  // Өлшемді контейнерге бейімдеу
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = Math.round(Math.max(320, Math.min(500, w * 0.62, window.innerHeight - 230)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const s = g.current;
      const ratio = s.w ? s.px / s.w : 0.5;
      s.w = w;
      s.h = h;
      s.dpr = dpr;
      s.px = s.tx = ratio * w;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.height = `${h}px`;
      draw();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    fit();
    setHud((h) => ({ ...h, best: best() }));
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const level = () => Math.min(LEVELS.length - 1, Math.floor(g.current.elapsed / LEVEL_SECONDS));

  const spawnWeather = (lv: number) => {
    const s = g.current;
    const target = lv === 0 ? 90 : lv === 1 ? 70 : 110;
    while (s.weather.length < target) {
      s.weather.push(
        lv === 1
          ? { x: Math.random() * s.w, y: Math.random() * s.h, vx: -10 + Math.random() * 20, vy: 30 + Math.random() * 40, r: 1 + Math.random() * 2.4, a: 0.4 + Math.random() * 0.5 }
          : { x: Math.random() * s.w, y: Math.random() * s.h, vx: lv === 2 ? -120 : -30, vy: 420 + Math.random() * 260, r: 1, a: 0.15 + Math.random() * 0.3 },
      );
    }
    if (s.weather.length > target) s.weather.length = target;
  };

  const reset = () => {
    const s = g.current;
    s.items = [];
    s.weather = [];
    s.bursts = [];
    s.score = 0;
    s.lives = 3;
    s.elapsed = 0;
    s.spawnAcc = 0;
    s.flash = 0;
    s.hurt = 0;
    s.noteIdx = 0;
    s.rainbow = 0;
    s.combo = 0;
    s.px = s.tx = s.w / 2;
    spawnWeather(0);
  };

  const start = () => {
    wrap.current?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    reset();
    setHud((h) => ({ ...h, score: 0, lives: 3, level: 0, time: 0 }));
    setP('playing');
    g.current.last = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
  };

  const finish = (won: boolean) => {
    const s = g.current;
    const b = Math.max(best(), s.score);
    try {
      localStorage.setItem('ms-weather-best', String(b));
    } catch {
      /* ignore */
    }
    setHud((h) => ({ ...h, score: s.score, best: b }));
    if (won) {
      setP('win');
      s.rainbow = 0;
      [0, 2, 4, 5].forEach((k, i) => window.setTimeout(() => playTone(SCALE[k], 0.6), i * 180));
      // кемпірқосақ анимациясын жалғастыру
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(loop);
    } else {
      setP('over');
    }
  };

  // Негізгі цикл
  const loop = useCallback((now: number) => {
    const s = g.current;
    const dt = Math.min(0.05, (now - s.last) / 1000);
    s.last = now;
    const ph = phaseRef.current;

    if (ph === 'playing') {
      s.elapsed += dt;
      const lv = level();
      const L = LEVELS[lv];
      spawnWeather(lv);

      // ойыншы
      const speed = s.w * 1.4;
      if (s.keys.left) s.tx -= speed * dt;
      if (s.keys.right) s.tx += speed * dt;
      s.tx = Math.max(40, Math.min(s.w - 40, s.tx));
      s.px += (s.tx - s.px) * Math.min(1, dt * 14);

      // жаңа заттар
      s.spawnAcc += dt * L.spawn * (1 + s.elapsed / TOTAL);
      while (s.spawnAcc >= 1) {
        s.spawnAcc -= 1;
        const r = Math.random();
        const kind: Item['kind'] = r < L.bolt * 0.55 ? 'bolt' : r > 0.93 ? 'star' : 'note';
        s.items.push({
          kind,
          x: 30 + Math.random() * (s.w - 60),
          y: -30,
          vy: L.speed * (0.8 + Math.random() * 0.5) * (kind === 'bolt' ? 1.25 : 1),
          r: kind === 'bolt' ? 18 : 17,
          wobble: Math.random() * Math.PI * 2,
          glyph: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)],
        });
      }

      // қозғалыс және ұстау
      const py = s.h - 46;
      for (const it of s.items) {
        it.y += it.vy * dt;
        it.wobble += dt * 3;
        if (it.kind !== 'bolt') it.x += Math.sin(it.wobble) * 22 * dt;
        const caught = Math.abs(it.x - s.px) < 46 && it.y > py - 22 && it.y < py + 14;
        if (caught) {
          it.y = s.h + 100;
          if (it.kind === 'bolt') {
            s.lives -= 1;
            s.hurt = 1;
            s.flash = 1;
            s.combo = 0;
            playZap();
            s.bursts.push({ x: s.px, y: py - 30, t: 0, color: '#fda4af', text: '−1 ♥' });
            if (navigator.vibrate) navigator.vibrate(120);
          } else {
            const pts = it.kind === 'star' ? 5 : 1;
            s.combo += 1;
            s.score += pts;
            playTone(SCALE[s.noteIdx % SCALE.length]);
            s.noteIdx += s.combo % 4 === 0 ? 2 : 1;
            s.bursts.push({ x: it.x, y: py - 30, t: 0, color: it.kind === 'star' ? '#fde39a' : '#d6c4ff', text: `+${pts}` });
          }
        }
      }
      s.items = s.items.filter((it) => it.y < s.h + 40);

      // дауылда кездейсоқ жарқыл
      if (lv === 2 && Math.random() < dt * 0.35) s.flash = 0.7;

      if (s.lives <= 0) {
        draw();
        finish(false);
        return;
      }
      if (s.elapsed >= TOTAL) {
        s.items = [];
        draw();
        finish(true);
        return;
      }
      setHud((h) => (h.score !== s.score || h.lives !== s.lives || h.level !== lv || Math.floor(h.time) !== Math.floor(s.elapsed) ? { ...h, score: s.score, lives: s.lives, level: lv, time: s.elapsed } : h));
    }

    if (ph === 'win') s.rainbow = Math.min(1, s.rainbow + dt * 0.5);

    // ауа райы бөлшектері
    for (const p of s.weather) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > s.h) {
        p.y = -10;
        p.x = Math.random() * s.w;
      }
      if (p.x < -20) p.x = s.w + 10;
      if (p.x > s.w + 20) p.x = -10;
    }
    for (const b of s.bursts) b.t += dt;
    s.bursts = s.bursts.filter((b) => b.t < 0.9);
    s.flash = Math.max(0, s.flash - dt * 2.5);
    s.hurt = Math.max(0, s.hurt - dt * 2);

    draw();
    if (phaseRef.current === 'playing' || (phaseRef.current === 'win' && s.rainbow < 1)) raf.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сурет салу
  const draw = () => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const s = g.current;
    const { w, h } = s;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    const lv = phaseRef.current === 'intro' ? 0 : level();
    const L = LEVELS[lv];

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, L.sky[0]);
    sky.addColorStop(1, L.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // бұлттар
    ctx.fillStyle = lv === 2 ? 'rgba(20,16,50,0.85)' : 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 197 + s.elapsed * (8 + i * 3)) % (w + 240)) - 120;
      const cy = 28 + (i % 3) * 22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 50, cy - 12, 60, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 50, cy - 6, 55, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ауа райы
    for (const p of s.weather) {
      if (lv === 1) {
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(180,200,255,${p.a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.03, p.y + p.vy * 0.03);
        ctx.stroke();
      }
    }

    // кемпірқосақ
    if (s.rainbow > 0) {
      const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#3b82f6', '#8b5cf6'];
      const R = Math.min(w * 0.45, h * 0.8);
      ctx.save();
      ctx.globalAlpha = s.rainbow * 0.9;
      ctx.lineWidth = R * 0.055;
      cols.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.arc(w / 2, h + 10, R - i * ctx.lineWidth, Math.PI, Math.PI + Math.PI * s.rainbow);
        ctx.stroke();
      });
      ctx.restore();
    }

    // заттар
    for (const it of s.items) {
      if (it.kind === 'bolt') {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(4, -22);
        ctx.lineTo(-10, 2);
        ctx.lineTo(-1, 2);
        ctx.lineTo(-6, 22);
        ctx.lineTo(11, -5);
        ctx.lineTo(2, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = it.kind === 'star' ? '#fde39a' : '#b394ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = it.kind === 'star' ? '#fde39a' : '#ffffff';
        ctx.font = `700 ${it.kind === 'star' ? 30 : 32}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.kind === 'star' ? '★' : it.glyph, it.x, it.y);
        ctx.restore();
      }
    }

    // ойыншы — алтын табақша
    if (phaseRef.current !== 'intro') {
      const py = h - 46;
      ctx.save();
      ctx.translate(s.px, py);
      if (s.hurt > 0) ctx.translate(Math.sin(s.hurt * 40) * 5 * s.hurt, 0);
      const grd = ctx.createLinearGradient(-44, 0, 44, 0);
      grd.addColorStop(0, '#c98f17');
      grd.addColorStop(0.5, '#fde39a');
      grd.addColorStop(1, '#c98f17');
      ctx.shadowColor = 'rgba(247,207,98,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(-46, -8);
      ctx.quadraticCurveTo(0, 30, 46, -8);
      ctx.lineTo(38, -8);
      ctx.quadraticCurveTo(0, 16, -38, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-46, -12, 92, 5);
      ctx.restore();
    }

    // ұпай жарқылдары
    for (const b of s.bursts) {
      ctx.globalAlpha = 1 - b.t / 0.9;
      ctx.fillStyle = b.color;
      ctx.font = '800 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.text, b.x, b.y - b.t * 50);
      ctx.globalAlpha = 1;
    }

    // найзағай жарқылы
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,240,${s.flash * 0.45})`;
      ctx.fillRect(0, 0, w, h);
    }
  };

  // Басқару: тінтуір / саусақ / пернелер
  const pointer = (clientX: number) => {
    const cv = canvas.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    g.current.tx = clientX - rect.left;
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        g.current.keys.left = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        g.current.keys.right = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') g.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') g.current.keys.right = false;
    };
    const vis = () => {
      if (document.hidden && phaseRef.current === 'playing') setP('paused');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      document.removeEventListener('visibilitychange', vis);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const togglePause = () => {
    if (phaseRef.current === 'playing') setP('paused');
    else if (phaseRef.current === 'paused') {
      setP('playing');
      g.current.last = performance.now();
      raf.current = requestAnimationFrame(loop);
    }
  };

  const L = LEVELS[hud.level];
  const timePct = Math.min(100, (hud.time / TOTAL) * 100);

  return (
    <div className="glass animate-fade-up overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <button type="button" className="btn-ghost !px-3.5" onClick={onBack}>
          <LuArrowLeft className="size-4" />
          Ойындар
        </button>
        <div className={`min-w-0 flex-1 ${phase === 'playing' || phase === 'paused' ? 'hidden sm:block' : ''}`}>
          <h3 className="font-display text-base font-semibold text-white sm:text-lg">Ауа райы саяхаты</h3>
          <p className="text-xs text-slate-400">Ноталарды ұста, найзағайдан қаш</p>
        </div>
        {(phase === 'playing' || phase === 'paused') && (
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-0.5" aria-label={`Өмір: ${hud.lives}`}>
              {[0, 1, 2].map((k) => (
                <LuHeart key={k} className={`size-4 ${k < hud.lives ? 'fill-rose-400 text-rose-400' : 'text-slate-600'}`} />
              ))}
            </span>
            <span className="rounded-full bg-gold-400/15 px-3 py-1 font-display text-sm font-semibold text-gold-200 tabular-nums ring-1 ring-gold-400/30">{hud.score}</span>
            <button type="button" className="icon-btn" onClick={togglePause} aria-label={phase === 'paused' ? 'Жалғастыру' : 'Үзіліс'}>
              {phase === 'paused' ? <LuPlay className="size-4" /> : <LuPause className="size-4" />}
            </button>
          </div>
        )}
      </div>

      {(phase === 'playing' || phase === 'paused') && (
        <div className="flex items-center gap-3 px-4 pb-3 text-xs font-semibold text-slate-300 sm:px-5">
          <span className="shrink-0">
            {hud.level + 1}-кезең: <span className="text-gold-200">{L.name}</span>
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-plum-400 to-gold-400" style={{ width: `${timePct}%` }} />
          </div>
          <span className="shrink-0 tabular-nums">{Math.max(0, Math.ceil(TOTAL - hud.time))} с</span>
        </div>
      )}

      <div
        ref={wrap}
        className="relative w-full touch-none select-none"
        onPointerMove={(e) => pointer(e.clientX)}
        onPointerDown={(e) => pointer(e.clientX)}
      >
        <canvas ref={canvas} className="block w-full" aria-label="Ойын алаңы" />

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-[2px]">
            <div className="max-w-sm animate-pop text-center">
              {phase === 'intro' && (
                <>
                  <p className="font-display text-5xl text-gold-300">♪</p>
                  <h4 className="mt-2 font-display text-xl font-semibold text-white">Ауа райы саяхаты</h4>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">
                    Аспаннан түскен ноталарды алтын табақшамен ұста, әр нота әуен шығарады. ★ — 5 ұпай. Найзағайдан қаш, әйтпесе өмірің азаяды.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Компьютерде: тінтуір немесе ← → пернелері. Телефонда: саусақпен жүргіз.</p>
                  <p className="mt-2 text-xs text-slate-400">Үш кезең: жаңбыр → қар → найзағайлы дауыл, әрқайсысы 20 секунд.</p>
                  <button type="button" className="btn-gold mt-6 !px-7 !py-3" onClick={start}>
                    <LuPlay className="size-4" /> Бастау
                  </button>
                  {hud.best > 0 && <p className="mt-3 text-xs text-slate-400">Ең жоғары нәтиже: {hud.best}</p>}
                </>
              )}
              {phase === 'paused' && (
                <>
                  <h4 className="font-display text-xl font-semibold text-white">Үзіліс</h4>
                  <button type="button" className="btn-gold mt-5" onClick={togglePause}>
                    <LuPlay className="size-4" /> Жалғастыру
                  </button>
                </>
              )}
              {(phase === 'over' || phase === 'win') && (
                <>
                  <p className="font-display text-5xl">{phase === 'win' ? '🌈' : '⚡'}</p>
                  <h4 className="mt-2 font-display text-xl font-semibold text-white">{phase === 'win' ? 'Саяхат аяқталды! Кемпірқосақ шықты!' : 'Найзағай жеңіп кетті!'}</h4>
                  <p className="mt-3 text-sm text-slate-200">
                    Нәтижең: <b className="font-display text-lg text-gold-200">{hud.score}</b> ұпай
                    {hud.best > 0 && <span className="text-slate-400"> · ең жоғарысы: {hud.best}</span>}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button type="button" className="btn-ghost" onClick={onBack}>
                      Басқа ойын
                    </button>
                    <button type="button" className="btn-gold" onClick={start}>
                      Қайта ойнау
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Табиғат дыбыстарын браузердің өзінде (Web Audio API) жасау.
 * Ешқандай дайын аудиожазба керек емес.
 */

export type NatureSound = 'rain' | 'thunder' | 'wind' | 'blizzard' | 'birds' | 'waves';

let ctx: AudioContext | null = null;
let current: { stop: () => void } | null = null;

function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext, seconds: number, brown = false): AudioBuffer {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

function noiseSource(ac: AudioContext, seconds: number, brown = false) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, seconds, brown);
  return src;
}

/** Дыбысты ойнату; бұрынғысын тоқтатады. Ұзақтығы — секунд. */
export function playNature(kind: NatureSound, duration = 5): void {
  stopNature();
  const ac = audio();
  const t0 = ac.currentTime + 0.05;
  const end = t0 + duration;
  const master = ac.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.9, t0 + 0.4);
  master.gain.setValueAtTime(0.9, end - 0.6);
  master.gain.linearRampToValueAtTime(0, end);
  master.connect(ac.destination);
  const nodes: AudioScheduledSourceNode[] = [];
  const started = new Set<AudioScheduledSourceNode>();
  const timers: number[] = [];

  if (kind === 'rain') {
    const n = noiseSource(ac, duration + 0.5);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = ac.createGain();
    g.gain.value = 0.35;
    n.connect(hp).connect(lp).connect(g).connect(master);
    nodes.push(n);
    // жеке тамшылар
    for (let i = 0; i < duration * 22; i++) {
      const at = t0 + Math.random() * duration;
      const o = ac.createOscillator();
      const og = ac.createGain();
      o.frequency.setValueAtTime(1800 + Math.random() * 2500, at);
      o.frequency.exponentialRampToValueAtTime(400, at + 0.04);
      og.gain.setValueAtTime(0.08, at);
      og.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      o.connect(og).connect(master);
      o.start(at);
      o.stop(at + 0.06);
      nodes.push(o);
      started.add(o);
    }
  }

  if (kind === 'thunder') {
    // 1) жарқылдың сартылы
    const crack = noiseSource(ac, 0.6);
    const cf = ac.createBiquadFilter();
    cf.type = 'highpass';
    cf.frequency.value = 1500;
    const cg = ac.createGain();
    cg.gain.setValueAtTime(0, t0 + 0.2);
    cg.gain.linearRampToValueAtTime(1.0, t0 + 0.23);
    cg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
    crack.connect(cf).connect(cg).connect(master);
    nodes.push(crack);
    // 2) ұзақ күркіреу
    const rumble = noiseSource(ac, duration + 0.5, true);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, t0);
    lp.frequency.exponentialRampToValueAtTime(90, end);
    const rg = ac.createGain();
    rg.gain.setValueAtTime(0, t0 + 0.3);
    rg.gain.linearRampToValueAtTime(1.6, t0 + 0.8);
    rg.gain.setValueAtTime(1.1, t0 + 1.6);
    rg.gain.linearRampToValueAtTime(1.5, t0 + 2.2);
    rg.gain.exponentialRampToValueAtTime(0.01, end);
    rumble.connect(lp).connect(rg).connect(master);
    nodes.push(rumble);
  }

  if (kind === 'wind' || kind === 'blizzard') {
    const n = noiseSource(ac, duration + 0.5);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = kind === 'wind' ? 6 : 2;
    bp.frequency.value = 500;
    const lfo = ac.createOscillator();
    lfo.frequency.value = kind === 'wind' ? 0.25 : 0.6;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = kind === 'wind' ? 350 : 700;
    lfo.connect(lfoGain).connect(bp.frequency);
    const g = ac.createGain();
    g.gain.value = kind === 'wind' ? 0.9 : 0.7;
    n.connect(bp).connect(g).connect(master);
    nodes.push(n, lfo);
    if (kind === 'blizzard') {
      const hiss = noiseSource(ac, duration + 0.5);
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 4000;
      const hg = ac.createGain();
      hg.gain.value = 0.25;
      const lfo2 = ac.createOscillator();
      lfo2.frequency.value = 1.3;
      const l2g = ac.createGain();
      l2g.gain.value = 0.15;
      lfo2.connect(l2g).connect(hg.gain);
      hiss.connect(hp).connect(hg).connect(master);
      nodes.push(hiss, lfo2);
    }
  }

  if (kind === 'waves') {
    const n = noiseSource(ac, duration + 0.5, true);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ac.createGain();
    g.gain.value = 0;
    // толқындар: әр 2.5 секунд сайын көтеріліп, басылады
    for (let at = t0; at < end; at += 2.5) {
      g.gain.setValueAtTime(0.15, at);
      g.gain.linearRampToValueAtTime(1.6, at + 1.1);
      g.gain.linearRampToValueAtTime(0.15, at + 2.4);
    }
    n.connect(lp).connect(g).connect(master);
    nodes.push(n);
  }

  if (kind === 'birds') {
    const chirp = (at: number, base: number) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      const og = ac.createGain();
      const len = 0.07 + Math.random() * 0.08;
      o.frequency.setValueAtTime(base, at);
      o.frequency.exponentialRampToValueAtTime(base * (1.4 + Math.random() * 0.6), at + len * 0.6);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, at + len);
      og.gain.setValueAtTime(0.0001, at);
      og.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(og).connect(master);
      o.start(at);
      o.stop(at + len + 0.02);
      nodes.push(o);
      started.add(o);
    };
    let at = t0 + 0.2;
    while (at < end - 0.4) {
      const base = 2200 + Math.random() * 1800;
      const n = 2 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) chirp(at + i * 0.13, base);
      at += n * 0.13 + 0.3 + Math.random() * 0.6;
    }
  }

  // Ұзақ көздерді (шу, LFO) бастау. Тамшылар мен шырылдар өз уақытында бұрын басталған.
  for (const s of nodes) {
    if (started.has(s)) continue;
    s.start(t0);
    s.stop(end + 0.1);
  }

  const stop = () => {
    timers.forEach((t) => clearTimeout(t));
    try {
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.15);
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      nodes.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* ignore */
        }
      });
      master.disconnect();
    }, 200);
  };
  timers.push(window.setTimeout(() => current === handle && (current = null), (duration + 0.2) * 1000));
  const handle = { stop };
  current = handle;
}

export function stopNature(): void {
  if (current) {
    current.stop();
    current = null;
  }
}

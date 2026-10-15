import { WaveLine } from './SoundWave';

export default function Hero({ counts }: { counts: { audio: number; video: number; image: number } }) {
  const stats = [
    { n: counts.audio, l: 'аудио' },
    { n: counts.video, l: 'видео' },
    { n: counts.image, l: 'сурет' },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-10 pb-4 sm:px-6 sm:pt-16">
      <div className="animate-fade-up text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/[0.06] px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-200">
          <span className="size-1.5 rounded-full bg-gold-400 shadow-[0_0_10px] shadow-gold-400" />
          Физика, музыка және ағылшын тілі сабағына арналған медиа кеңістік
        </p>
        <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          ФИЗИКА <span className="text-gold-gradient">+</span> МУЗЫКА
        </h1>
        <p className="mt-3 font-display text-lg font-medium text-plum-300 sm:text-2xl">Дыбыс пен құбылыс әлемі</p>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300/85 sm:text-base">
          Табиғат құбылыстарын бақылаңыз, дыбыстың физикасын тыңдаңыз, тәжірибелер мен ойындар арқылы үйреніңіз — барлығы бір жерде.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-2xl font-semibold text-white sm:text-3xl">{s.n}</div>
              <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mx-auto mt-6 flex max-w-xs gap-1.5">
        {['#e85d4a', '#f28c38', '#f2c53a', '#6db33f', '#2bb3a3', '#1e88c8', '#7b61ff'].map((c) => (
          <span key={c} className="h-1.5 flex-1 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-6 sm:mt-8">
        <WaveLine />
      </div>
    </section>
  );
}

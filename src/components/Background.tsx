const NOTES = ['♪', 'λ', '♫', 'Hz', '⚛', '♬', 'f = 1/T', '𝄞', 'ν', '♩', 'E = hν', '∿', '♪', 'c', '♫', 'Ω'];

/** Нәзік анимацияланған фон: жарық дақтары, қалқып жүрген ноталар мен физика белгілері. */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_15%_-10%,#0f3b6e_0%,transparent_60%),radial-gradient(900px_500px_at_95%_10%,#0c3a4a_0%,transparent_55%),linear-gradient(180deg,#061227_0%,#040b1c_100%)]" />
      <div className="absolute -top-40 left-1/4 size-[520px] animate-glow rounded-full bg-plum-600/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 size-[460px] animate-glow rounded-full bg-ink-600/40 blur-[120px] [animation-delay:-3s]" />
      <div className="absolute bottom-0 left-0 size-[380px] animate-glow rounded-full bg-[#2bb3a3]/[0.10] blur-[110px] [animation-delay:-5s]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 22px)',
          maskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
        }}
      />
      {NOTES.map((n, i) => (
        <span
          key={i}
          className="absolute bottom-0 animate-float-note font-display text-gold-300"
          style={{
            left: `${(i * 83 + 7) % 100}%`,
            fontSize: `${14 + ((i * 7) % 22)}px`,
            animationDelay: `${-i * 1.7}s`,
            animationDuration: `${13 + ((i * 5) % 9)}s`,
            ['--note-opacity' as string]: `${0.12 + ((i * 3) % 5) * 0.05}`,
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

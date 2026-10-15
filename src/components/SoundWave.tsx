/** Дыбыс толқынының анимациясы (эквалайзер). */
export function Equalizer({ active = true, bars = 5, className = '' }: { active?: boolean; bars?: number; className?: string }) {
  return (
    <span className={`inline-flex h-4 items-end gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] origin-bottom rounded-full bg-gradient-to-t from-plum-400 to-gold-300 ${active ? 'animate-eq' : ''}`}
          style={{ height: '100%', animationDelay: `${-i * 0.18}s`, transform: active ? undefined : `scaleY(${0.3 + ((i * 37) % 50) / 100})` }}
        />
      ))}
    </span>
  );
}

/** Үлкен толқынды сызық — басты бөлімге арналған. */
export function WaveLine() {
  // Периодты толқын: x=0 мен x=1200 нүктелері бірдей, сондықтан қайталанғанда жік көрінбейді.
  const path = Array.from({ length: 121 })
    .map((_, i) => {
      const x = i * 10;
      const t = (2 * Math.PI * x) / 1200;
      const y = 40 + 16 * Math.sin(3 * t) + 9 * Math.sin(7 * t + 1) * Math.sin(2 * t);
      return `${i === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div className="relative h-20 w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]" aria-hidden="true">
      <div className="flex w-[200%] animate-wave">
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-20 w-1/2">
            <defs>
              <linearGradient id={`wg${k}`} x1="0" x2="1">
                <stop offset="0" stopColor="#5cc6e6" />
                <stop offset="0.5" stopColor="#f6b851" />
                <stop offset="1" stopColor="#5cc6e6" />
              </linearGradient>
            </defs>
            <path d={path} fill="none" stroke={`url(#wg${k})`} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
            <path d={path} fill="none" stroke="#2bb3a3" strokeWidth="1" opacity="0.35" transform="translate(0,8)" />
          </svg>
        ))}
      </div>
    </div>
  );
}

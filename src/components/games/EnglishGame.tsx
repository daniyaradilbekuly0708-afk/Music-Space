import { LuArrowLeft, LuExternalLink } from 'react-icons/lu';

/** Ағылшын тілі ойындары — дайын HTML беттер (public/english/), сайт ішінде ашылады. */
export default function EnglishGame({ file, title, subtitle, onBack }: { file: string; title: string; subtitle: string; onBack: () => void }) {
  const src = `${import.meta.env.BASE_URL}english/${file}`;
  return (
    <div className="glass animate-fade-up rounded-3xl p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3 px-1 sm:mb-4">
        <button type="button" className="btn-ghost !px-3.5" onClick={onBack}>
          <LuArrowLeft className="size-4" />
          Ойындар
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-white sm:text-lg">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <a href={src} target="_blank" rel="noopener" className="btn-ghost !px-3.5 !text-xs">
          <LuExternalLink className="size-4" />
          Толық экран
        </a>
      </div>
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen"
        className="block h-[78vh] min-h-[560px] w-full rounded-2xl border-0 bg-ink-950"
      />
    </div>
  );
}

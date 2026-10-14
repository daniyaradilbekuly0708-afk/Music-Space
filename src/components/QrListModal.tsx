import { LuHeadphones, LuImages, LuMonitorPlay, LuQrCode } from 'react-icons/lu';
import Modal from './Modal';
import type { Material, MaterialType } from '../types';

const ICON: Record<MaterialType, typeof LuHeadphones> = { audio: LuHeadphones, video: LuMonitorPlay, image: LuImages };
const GROUPS: { type: MaterialType; label: string }[] = [
  { type: 'audio', label: 'Аудио' },
  { type: 'video', label: 'Видео' },
  { type: 'image', label: 'Суреттер' },
];

interface Props {
  open: boolean;
  materials: Material[];
  onClose: () => void;
  onPick: (m: Material) => void;
}

/** Мұғалімге арналған бөлім: барлық материалдың QR кодтары бір жерде. */
export default function QrListModal({ open, materials, onClose, onPick }: Props) {
  const published = materials.filter((m) => m.is_published);
  return (
    <Modal open={open} onClose={onClose} title="Кітапқа арналған QR кодтар" size="lg">
      <p className="mb-5 text-sm leading-relaxed text-slate-400">
        Материалды таңдап, оның QR кодын PNG ретінде жүктеп алыңыз да, кітапқа немесе жұмыс параққа қойыңыз. Оқушы кодты сканерлегенде, материал сайтта бірден ойнайды.
      </p>
      {published.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-slate-400">
          Әзірге жарияланған материал жоқ. Алдымен ән, видео немесе сурет жүктеп, жариялаңыз.
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map(({ type, label }) => {
            const items = published.filter((m) => m.type === type);
            if (!items.length) return null;
            const Icon = ICON[type];
            return (
              <section key={type}>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-plum-300 uppercase">
                  <Icon className="size-4" /> {label} <span className="text-slate-500">{items.length}</span>
                </h3>
                <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {items.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{m.title}</span>
                      <button type="button" className="btn-gold shrink-0 !px-3.5 !py-1.5 !text-xs" onClick={() => onPick(m)}>
                        <LuQrCode className="size-3.5" />
                        QR код
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

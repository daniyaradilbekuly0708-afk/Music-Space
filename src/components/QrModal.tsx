import { useEffect, useState } from 'react';
import { LuCheck, LuCopy, LuDownload } from 'react-icons/lu';
import Modal from './Modal';
import type { Material } from '../types';
import { materialLink, printableQr } from '../lib/qr';

interface Props {
  material: Material | null;
  onClose: () => void;
}

function safeFileName(title: string): string {
  const s = title.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 60);
  return `QR-${s || 'material'}.png`;
}

export default function QrModal({ material, onClose }: Props) {
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = material ? materialLink(material) : '';

  useEffect(() => {
    if (!material) return;
    let alive = true;
    setPng(null);
    setError(null);
    setCopied(false);
    printableQr(material)
      .then((d) => alive && setPng(d))
      .catch(() => alive && setError('QR кодты жасау мүмкін болмады. Бетті жаңартып, қайталап көріңіз.'));
    return () => {
      alive = false;
    };
  }, [material]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('qr-link') as HTMLInputElement | null;
      el?.select();
    }
  };

  return (
    <Modal open={Boolean(material)} onClose={onClose} title="Кітапқа арналған QR код" size="md">
      {material && (
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-sm leading-relaxed text-slate-400">
            Оқушы бұл кодты телефон камерасымен сканерлегенде, сайтта <b className="text-slate-200">«{material.title}»</b>{' '}
            {material.type === 'audio' ? 'бірден ойнай бастайды.' : material.type === 'video' ? 'видеосы бірден ашылады.' : 'суреті бірден ашылады.'}
          </p>

          <div className="grid w-full max-w-xs place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/40">
            {png ? (
              <img src={png} alt={`QR код: ${material.title}`} className="h-auto w-full" />
            ) : error ? (
              <p className="p-6 text-center text-sm font-semibold text-rose-600">{error}</p>
            ) : (
              <span className="m-16 size-10 animate-spin rounded-full border-4 border-slate-200 border-t-plum-500" />
            )}
          </div>

          {!material.is_published && (
            <p className="mt-4 rounded-xl bg-amber-400/10 px-3 py-2 text-center text-xs font-semibold text-amber-200 ring-1 ring-amber-300/25">
              Бұл материал әлі жарияланбаған. Оқушылар QR кодты ашуы үшін алдымен оны жариялаңыз.
            </p>
          )}

          <div className="mt-5 w-full">
            <label className="label" htmlFor="qr-link">
              Тікелей сілтеме
            </label>
            <div className="flex gap-2">
              <input id="qr-link" readOnly value={link} className="field !py-2.5 text-sm" onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn-ghost shrink-0 !px-3" onClick={copy} aria-label="Сілтемені көшіру">
                {copied ? <LuCheck className="size-4 text-emerald-300" /> : <LuCopy className="size-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Жабу
            </button>
            {png ? (
              <a href={png} download={safeFileName(material.title)} className="btn-gold">
                <LuDownload className="size-4" />
                PNG жүктеп алу
              </a>
            ) : (
              <button type="button" className="btn-gold" disabled>
                <LuDownload className="size-4" />
                PNG жүктеп алу
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

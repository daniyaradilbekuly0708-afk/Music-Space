import { useState } from 'react';
import { LuTrash2 } from 'react-icons/lu';
import Modal from './Modal';
import type { Material } from '../types';

interface Props {
  material: Material | null;
  onClose: () => void;
  onConfirm: (m: Material) => Promise<void>;
}

export default function ConfirmDialog({ material, onClose, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={Boolean(material)} onClose={onClose} title="Материалды өшіру" size="sm" closable={!busy}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-rose-500/15 ring-1 ring-rose-400/30">
          <LuTrash2 className="size-6 text-rose-300" />
        </div>
        <p className="text-[15px] text-white">
          «<b>{material?.title}</b>» материалын өшіру керек пе?
        </p>
        <p className="mt-2 text-sm text-slate-400">Файл қоймадан біржола жойылады. Бұл әрекетті қайтару мүмкін емес.</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy} data-autofocus>
          Бас тарту
        </button>
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400 disabled:opacity-60"
          onClick={async () => {
            if (!material) return;
            setBusy(true);
            try {
              await onConfirm(material);
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Өшірілуде…' : 'Өшіру'}
        </button>
      </div>
    </Modal>
  );
}

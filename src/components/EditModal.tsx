import { useEffect, useState, type FormEvent } from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import Modal from './Modal';
import type { Material, MaterialPatch, Subject } from '../types';
import { SUBJECTS } from './SubjectSwitch';
import { DESCRIPTION_MAX, TITLE_MAX } from '../lib/config';

interface Props {
  material: Material | null;
  onClose: () => void;
  onSave: (id: string, patch: MaterialPatch) => Promise<void>;
}

export default function EditModal({ material, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [subject, setSubject] = useState<Subject>('music');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setDescription(material.description);
      setPublished(material.is_published);
      setSubject(material.subject);
      setError(null);
      setSaving(false);
    }
  }, [material]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!material) return;
    if (!title.trim()) return setError('Атауы бос болмауы керек.');
    setSaving(true);
    setError(null);
    try {
      await onSave(material.id, { title, description, is_published: published, ...(subject !== material.subject && { subject }) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сақтау мүмкін болмады.');
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(material)} onClose={onClose} title="Материалды өңдеу" closable={!saving}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
            <span className="label">Бөлім</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Бөлім">
              {SUBJECTS.map(({ id, label, icon: Icon }) => {
                const on = id === subject;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={saving}
                    onClick={() => setSubject(id)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-2 py-2.5 text-sm font-bold transition ${
                      on ? 'border-gold-400/60 bg-gold-400/10 text-gold-200' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

        <div>
          <label className="label" htmlFor="ed-title">
            Атауы
          </label>
          <input id="ed-title" className="field" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} data-autofocus />
        </div>
        <div>
          <label className="label" htmlFor="ed-desc">
            Қысқаша сипаттама
          </label>
          <textarea id="ed-desc" className="field min-h-28 resize-y" value={description} maxLength={DESCRIPTION_MAX} onChange={(e) => setDescription(e.target.value)} />
          <p className="mt-1 text-right text-[11px] text-slate-500 tabular-nums">
            {description.length}/{DESCRIPTION_MAX}
          </p>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-white">{published ? 'Жарияланған' : 'Жоба (жасырын)'}</span>
            <span className="block text-xs text-slate-400">{published ? 'Барлық келушілерге көрінеді.' : 'Тек мұғалімге көрінеді.'}</span>
          </span>
          <input type="checkbox" className="peer sr-only" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-gold-500 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
        </label>
        {error && (
          <div className="flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-100" role="alert">
            <LuCircleAlert className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Бас тарту
          </button>
          <button type="submit" className="btn-gold min-w-32" disabled={saving}>
            {saving ? 'Сақталуда…' : 'Сақтау'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { LuCircleAlert, LuEye, LuEyeOff, LuFlaskConical, LuLock } from 'react-icons/lu';
import Modal from './Modal';

interface Props {
  open: boolean;
  demo: boolean;
  demoLogin: { email: string; password: string } | null;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginModal({ open, demo, demoLogin, onClose, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setBusy(false);
      setPassword('');
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Электрондық пошта мен құпиясөзді енгізіңіз.');
    setBusy(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Кіру мүмкін болмады.');
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Мұғалімнің кіруі" size="sm" closable={!busy}>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-plum-500 to-ink-600 ring-1 ring-white/15">
          <LuLock className="size-5 text-gold-300" />
        </div>
        <p className="text-sm leading-relaxed text-slate-400">Материал жүктеу, өңдеу және өшіру тек мұғалімге қолжетімді.</p>
      </div>

      {demo && demoLogin && (
        <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-400/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-amber-100">
          <p className="flex items-center gap-1.5 font-bold">
            <LuFlaskConical className="size-4 text-amber-300" /> Демо режим
          </p>
          <p className="mt-1">
            Пошта: <code className="rounded bg-black/30 px-1">{demoLogin.email}</code> · Құпиясөз: <code className="rounded bg-black/30 px-1">{demoLogin.password}</code>
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-bold text-gold-300 underline underline-offset-4"
            onClick={() => {
              setEmail(demoLogin.email);
              setPassword(demoLogin.password);
            }}
          >
            Демо деректерді толтыру
          </button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="lg-email">
            Электрондық пошта
          </label>
          <input id="lg-email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mugalim@mektep.kz" data-autofocus />
        </div>
        <div>
          <label className="label" htmlFor="lg-pass">
            Құпиясөз
          </label>
          <div className="relative">
            <input id="lg-pass" type={show ? 'text' : 'password'} autoComplete="current-password" className="field pr-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" className="icon-btn absolute top-1/2 right-1.5 -translate-y-1/2" onClick={() => setShow((v) => !v)} aria-label={show ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'}>
              {show ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div className="flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-100" role="alert">
            <LuCircleAlert className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" className="btn-gold w-full !py-3" disabled={busy}>
          {busy ? 'Тексерілуде…' : 'Кіру'}
        </button>
      </form>
    </Modal>
  );
}

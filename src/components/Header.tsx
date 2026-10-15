import { LuCloudUpload, LuDatabase, LuFlaskConical, LuKeyRound, LuLogOut } from 'react-icons/lu';
import type { AppUser, RepoMode } from '../types';

interface Props {
  mode: RepoMode | null;
  user: AppUser | null;
  teacher: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onUpload: () => void;
}

export default function Header({ mode, user, teacher, onLogin, onLogout, onUpload }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#" className="group flex min-w-0 items-center gap-3" aria-label="PHENOMENON LAB — басты бет">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-plum-500 to-ink-600 shadow-lg shadow-plum-900/40 ring-1 ring-white/15">
            <svg viewBox="0 0 24 24" className="size-6 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="10" ry="4" opacity="0.75" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" opacity="0.75" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" opacity="0.75" />
              <path d="M11 15.2a1.7 1.7 0 1 1-1.1-1.6V8.4l4.6-1v5.6a1.7 1.7 0 1 1-1.1-1.6V9l-2.4.5Z" fill="currentColor" stroke="none" />
            </svg>
            <span className="absolute -inset-1 -z-10 rounded-2xl bg-plum-500/30 opacity-0 blur-md transition group-hover:opacity-100" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[15px] font-bold tracking-[0.1em] text-white sm:text-base">PHENOMENON <span className="text-gold-300">LAB</span></span>
            <span className="block truncate text-xs font-medium text-plum-300/90">Физика · Музыка · English</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          {mode && (
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold md:inline-flex ${
                mode === 'demo' ? 'bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/25' : 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20'
              }`}
              title={mode === 'demo' ? 'Материалдар тек осы браузерде сақталады' : 'Материалдар Supabase серверінде сақталады'}
            >
              {mode === 'demo' ? <LuFlaskConical className="size-3.5" /> : <LuDatabase className="size-3.5" />}
              {mode === 'demo' ? 'Демо режим' : 'Сервер қосулы'}
            </span>
          )}

          {teacher ? (
            <>
              <button type="button" className="btn-gold" onClick={onUpload}>
                <LuCloudUpload className="size-4" />
                <span className="hidden sm:inline">Материал жүктеу</span>
                <span className="sm:hidden">Жүктеу</span>
              </button>
              <button type="button" className="icon-btn" onClick={onLogout} title={`Шығу (${user?.email ?? ''})`} aria-label="Жүйеден шығу">
                <LuLogOut className="size-[18px]" />
              </button>
            </>
          ) : (
            <button type="button" className="btn-ghost !px-3 sm:!px-4" onClick={onLogin}>
              <LuKeyRound className="size-4 text-gold-300" />
              <span className="hidden sm:inline">Мұғалім кіруі</span>
              <span className="sm:hidden">Кіру</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

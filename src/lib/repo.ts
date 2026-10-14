import type { Repo } from '../types';
import { createDemoRepo } from './demoRepo';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase кілттері .env-те болса — НАҚТЫ СЕРВЕР, болмаса — ДЕМО режимі. */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_URL.includes('xxxx'),
);

let repoPromise: Promise<Repo> | null = null;

export function getRepo(): Promise<Repo> {
  if (!repoPromise) {
    repoPromise = isSupabaseConfigured
      ? import('./supabaseRepo').then((m) => m.createSupabaseRepo(SUPABASE_URL!, SUPABASE_ANON_KEY!))
      : Promise.resolve(createDemoRepo());
  }
  return repoPromise;
}

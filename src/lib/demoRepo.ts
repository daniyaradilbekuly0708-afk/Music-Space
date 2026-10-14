import type { AppUser, Material, MaterialPatch, NewMaterialInput, Repo } from '../types';
import { TYPE_CONFIG, fileExt } from './config';

/**
 * ДЕМО РЕЖИМІ.
 * Supabase кілттері бапталмаған кезде ғана қосылады.
 * Файлдар тек ОСЫ браузердің IndexedDB қоймасында сақталады:
 * басқа компьютерде немесе телефонда көрінбейді.
 */

export const DEMO_LOGIN = { email: 'mugalim@demo.kz', password: 'demo1234' };

const DB_NAME = 'music-space-demo';
const STORE = 'materials';
const SESSION_KEY = 'music-space-demo-session';

type DemoRecord = Omit<Material, 'file_url' | 'cover_url'> & { blob: Blob; coverBlob: Blob | null };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error('Браузер қоймасын ашу мүмкін болмады.'));
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB қатесі'));
    t.oncomplete = () => db.close();
  });
}

const urlCache = new Map<string, string>();
function blobUrl(key: string, blob: Blob): string {
  let u = urlCache.get(key);
  if (!u) {
    u = URL.createObjectURL(blob);
    urlCache.set(key, u);
  }
  return u;
}

function toMaterial(r: DemoRecord): Material {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    file_path: r.file_path,
    cover_path: r.cover_path,
    mime_type: r.mime_type,
    size_bytes: r.size_bytes,
    is_published: r.is_published,
    created_at: r.created_at,
    file_url: blobUrl(r.id, r.blob),
    cover_url: r.coverBlob ? blobUrl(`${r.id}:cover`, r.coverBlob) : null,
  };
}

function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

export function createDemoRepo(): Repo {
  return {
    mode: 'demo',

    async list() {
      const all = await tx<DemoRecord[]>('readonly', (s) => s.getAll() as IDBRequest<DemoRecord[]>);
      const teacher = isLoggedIn();
      return all
        .filter((r) => teacher || r.is_published)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(toMaterial);
    },

    async create(input: NewMaterialInput, onProgress) {
      if (!isLoggedIn()) throw new Error('Алдымен мұғалім ретінде кіріңіз.');
      const ext = fileExt(input.file.name);
      const mime = TYPE_CONFIG[input.type].mimeByExt[ext];
      if (!mime) throw new Error('Бұл формат қолданылмайды.');

      // Жүктелу барысын имитациялау (демо).
      const steps = 24;
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 35));
        onProgress((i / steps) * 0.96);
      }
      const id = crypto.randomUUID();
      const record: DemoRecord = {
        id,
        type: input.type,
        title: input.title.trim(),
        description: input.description.trim(),
        file_path: `${id}.${ext}`,
        cover_path: input.cover ? `covers/${id}.jpg` : null,
        mime_type: mime,
        size_bytes: input.file.size,
        is_published: input.is_published,
        created_at: new Date().toISOString(),
        blob: input.file,
        coverBlob: input.cover,
      };
      try {
        await tx('readwrite', (s) => s.put(record));
      } catch {
        throw new Error('Браузер қоймасында орын жетпеді. Кішірек файл таңдаңыз.');
      }
      onProgress(1);
      return toMaterial(record);
    },

    async update(id: string, patch: MaterialPatch) {
      if (!isLoggedIn()) throw new Error('Рұқсат жоқ.');
      const rec = await tx<DemoRecord | undefined>('readonly', (s) => s.get(id) as IDBRequest<DemoRecord | undefined>);
      if (!rec) throw new Error('Материал табылмады.');
      const next: DemoRecord = {
        ...rec,
        ...(patch.title !== undefined && { title: patch.title.trim() }),
        ...(patch.description !== undefined && { description: patch.description.trim() }),
        ...(patch.is_published !== undefined && { is_published: patch.is_published }),
      };
      await tx('readwrite', (s) => s.put(next));
      return toMaterial(next);
    },

    async remove(m: Material) {
      if (!isLoggedIn()) throw new Error('Рұқсат жоқ.');
      await tx('readwrite', (s) => s.delete(m.id));
      for (const key of [m.id, `${m.id}:cover`]) {
        const u = urlCache.get(key);
        if (u) {
          URL.revokeObjectURL(u);
          urlCache.delete(key);
        }
      }
    },

    async getUser(): Promise<AppUser | null> {
      return isLoggedIn() ? { email: DEMO_LOGIN.email } : null;
    },

    async isTeacher() {
      return isLoggedIn();
    },

    async signIn(email: string, password: string) {
      await new Promise((r) => setTimeout(r, 300));
      if (email.trim().toLowerCase() !== DEMO_LOGIN.email || password !== DEMO_LOGIN.password) {
        throw new Error('Электрондық пошта немесе құпиясөз қате.');
      }
      try {
        localStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* браузер localStorage-ты бұғаттаған */
      }
      listeners.forEach((l) => l());
    },

    async signOut() {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    },

    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

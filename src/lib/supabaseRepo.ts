import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Material, MaterialPatch, MaterialType, NewMaterialInput, Repo, Subject } from '../types';
import { TYPE_CONFIG, fileExt } from './config';

/**
 * НАҚТЫ СЕРВЕР РЕЖИМІ.
 * Файлдар Supabase Storage-қа, материал туралы мәлімет Supabase Database-ке
 * жазылады. Мұғалімнің кіруі — Supabase Auth.
 */

interface MaterialRow {
  id: string;
  type: MaterialType;
  /** Дерекқор жаңартылмаған болса, бұл баған болмауы мүмкін. */
  subject?: Subject | null;
  title: string;
  description: string | null;
  file_path: string;
  cover_path: string | null;
  mime_type: string;
  size_bytes: number;
  is_published: boolean;
  created_at: string;
}

const COVER_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function createSupabaseRepo(url: string, anonKey: string): Repo {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const baseUrl = url.replace(/\/+$/, '');

  const publicUrl = (bucket: string, path: string) => sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  const toMaterial = (r: MaterialRow): Material => ({
    id: r.id,
    type: r.type,
    subject: r.subject === 'physics' ? 'physics' : 'music',
    title: r.title,
    description: r.description ?? '',
    file_path: r.file_path,
    file_url: publicUrl(TYPE_CONFIG[r.type].bucket, r.file_path),
    cover_path: r.cover_path,
    cover_url: r.cover_path ? publicUrl('images', r.cover_path) : null,
    mime_type: r.mime_type,
    size_bytes: Number(r.size_bytes),
    is_published: r.is_published,
    created_at: r.created_at,
  });

  async function accessToken(): Promise<string> {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Жүйеге қайта кіріңіз: сессия уақыты аяқталған.');
    return token;
  }

  /** XHR арқылы жүктеу — пайыздық прогресті көрсету үшін. */
  function uploadWithProgress(bucket: string, path: string, body: Blob, contentType: string, token: string, onProgress: (f: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const objectPath = path.split('/').map(encodeURIComponent).join('/');
      xhr.open('POST', `${baseUrl}/storage/v1/object/${bucket}/${objectPath}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', 'max-age=31536000');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(1);
          resolve();
        } else {
          reject(new Error(storageErrorMessage(xhr.status, xhr.responseText)));
        }
      };
      xhr.onerror = () => reject(new Error('Желі қатесі: интернет байланысын тексеріп, қайталап көріңіз.'));
      xhr.onabort = () => reject(new Error('Жүктеу тоқтатылды.'));
      xhr.send(body);
    });
  }

  return {
    mode: 'supabase',

    async list() {
      const { data, error } = await sb
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(dbErrorMessage(error.message));
      return (data as MaterialRow[]).map(toMaterial);
    },

    async create(input: NewMaterialInput, onProgress) {
      const cfg = TYPE_CONFIG[input.type];
      const ext = fileExt(input.file.name);
      const mime = cfg.mimeByExt[ext];
      if (!mime) throw new Error(`Бұл формат қолданылмайды. Рұқсат етілген: ${cfg.formatsLabel}.`);

      const token = await accessToken();
      const id = crypto.randomUUID();
      const filePath = `${id}.${ext}`;
      const coverMime = input.cover ? (COVER_MIME[input.cover.type] ? input.cover.type : 'image/jpeg') : null;
      const coverPath = input.cover && coverMime ? `covers/${id}.${COVER_MIME[coverMime]}` : null;
      const mainShare = coverPath ? 0.94 : 1;

      await uploadWithProgress(cfg.bucket, filePath, input.file, mime, token, (f) => onProgress(f * mainShare));

      try {
        if (input.cover && coverPath && coverMime) {
          await uploadWithProgress('images', coverPath, input.cover, coverMime, token, (f) => onProgress(mainShare + f * (1 - mainShare)));
        }
        const { data, error } = await sb
          .from('materials')
          .insert({
            id,
            type: input.type,
            subject: input.subject,
            title: input.title.trim(),
            description: input.description.trim(),
            file_path: filePath,
            cover_path: coverPath,
            mime_type: mime,
            size_bytes: input.file.size,
            is_published: input.is_published,
          })
          .select()
          .single();
        if (error) throw new Error(dbErrorMessage(error.message));
        return toMaterial(data as MaterialRow);
      } catch (err) {
        // Мәлімет сақталмаса — жүктелген файлдарды тазалаймыз.
        await sb.storage.from(cfg.bucket).remove([filePath]).catch(() => undefined);
        if (coverPath) await sb.storage.from('images').remove([coverPath]).catch(() => undefined);
        throw err;
      }
    },

    async update(id: string, patch: MaterialPatch) {
      const clean: MaterialPatch = { ...patch };
      if (clean.title !== undefined) clean.title = clean.title.trim();
      if (clean.description !== undefined) clean.description = clean.description.trim();
      const { data, error } = await sb.from('materials').update(clean).eq('id', id).select().single();
      if (error) throw new Error(dbErrorMessage(error.message));
      return toMaterial(data as MaterialRow);
    },

    async remove(m: Material) {
      const { error } = await sb.from('materials').delete().eq('id', m.id);
      if (error) throw new Error(dbErrorMessage(error.message));
      const { error: e1 } = await sb.storage.from(TYPE_CONFIG[m.type].bucket).remove([m.file_path]);
      if (m.cover_path) await sb.storage.from('images').remove([m.cover_path]);
      if (e1) console.warn('Файлды қоймадан өшіру сәтсіз:', e1.message);
    },

    async getUser() {
      const { data } = await sb.auth.getSession();
      const email = data.session?.user.email;
      return email ? { email } : null;
    },

    async isTeacher() {
      const { data: s } = await sb.auth.getSession();
      if (!s.session) return false;
      const { data, error } = await sb.rpc('is_teacher');
      if (error) return false;
      return data === true;
    },

    async signIn(email: string, password: string) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/invalid login credentials/i.test(error.message)) throw new Error('Электрондық пошта немесе құпиясөз қате.');
        if (/email not confirmed/i.test(error.message)) throw new Error('Электрондық пошта расталмаған. Supabase-те пайдаланушыны растаңыз.');
        throw new Error(`Кіру мүмкін болмады: ${error.message}`);
      }
      const ok = await this.isTeacher();
      if (!ok) {
        await sb.auth.signOut();
        throw new Error('Бұл аккаунтқа мұғалім рұқсаты берілмеген.');
      }
    },

    async signOut() {
      await sb.auth.signOut();
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        // setTimeout — Supabase ұсынысы: callback ішінде басқа auth шақыруларын бірден жасамау.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(cb, 0);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}

function storageErrorMessage(status: number, body: string): string {
  let msg = '';
  try {
    const j = JSON.parse(body) as { message?: string; error?: string; statusCode?: string | number };
    msg = `${j.message ?? ''} ${j.error ?? ''} ${j.statusCode ?? ''}`.toLowerCase();
  } catch {
    msg = body.toLowerCase();
  }
  if (status === 413 || /too large|exceeded the maximum|payload too large|413/.test(msg)) {
    return 'Файл көлемі сервердегі шектен асып кетті. Кішірек файл таңдаңыз.';
  }
  if (status === 415 || /mime type|not supported|invalid_mime/.test(msg)) {
    return 'Сервер бұл файл форматын қабылдамады. Рұқсат етілген форматтағы файлды таңдаңыз.';
  }
  if (status === 401 || status === 403 || /row-level security|unauthorized|jwt/.test(msg)) {
    return 'Рұқсат жоқ: материалды тек мұғалім жүктей алады. Жүйеге қайта кіріңіз.';
  }
  if (status === 409 || /already exists|duplicate/.test(msg)) {
    return 'Мұндай файл бұрыннан бар. Қайталап көріңіз.';
  }
  if (/bucket not found/.test(msg)) {
    return 'Қойма (bucket) табылмады. supabase/schema.sql файлын іске қосыңыз.';
  }
  return `Жүктеу кезінде қате шықты (код ${status}). Қайталап көріңіз.`;
}

function dbErrorMessage(raw: string): string {
  if (/subject/i.test(raw) && /column|schema cache/i.test(raw)) {
    return 'Дерекқорда «бөлім» (subject) бағаны әлі жоқ. Supabase → SQL Editor-де supabase/add_subject.sql файлын бір рет іске қосыңыз.';
  }
  if (/row-level security/i.test(raw)) return 'Рұқсат жоқ: бұл әрекетті тек мұғалім орындай алады.';
  if (/relation .*materials.* does not exist|could not find the table/i.test(raw)) {
    return 'Дерекқор кестесі табылмады. supabase/schema.sql файлын іске қосыңыз.';
  }
  if (/failed to fetch|network/i.test(raw)) return 'Серверге қосылу мүмкін болмады. Интернетті тексеріңіз.';
  return raw;
}

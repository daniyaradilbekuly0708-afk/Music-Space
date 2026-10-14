import type { MaterialType } from '../types';

export interface TypeConfig {
  label: string;
  bucket: string;
  exts: string[];
  mimeByExt: Record<string, string>;
  maxMB: number;
  accept: string;
  formatsLabel: string;
}

const envVideoMB = Number(import.meta.env.VITE_MAX_VIDEO_MB);

export const TYPE_CONFIG: Record<MaterialType, TypeConfig> = {
  audio: {
    label: 'Аудио',
    bucket: 'audio',
    exts: ['mp3', 'wav', 'ogg'],
    mimeByExt: { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' },
    maxMB: 50,
    accept: '.mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg',
    formatsLabel: 'MP3, WAV, OGG',
  },
  video: {
    label: 'Видео',
    bucket: 'video',
    exts: ['mp4', 'webm'],
    mimeByExt: { mp4: 'video/mp4', webm: 'video/webm' },
    maxMB: Number.isFinite(envVideoMB) && envVideoMB > 0 ? envVideoMB : 50,
    accept: '.mp4,.webm,video/mp4,video/webm',
    formatsLabel: 'MP4, WEBM',
  },
  image: {
    label: 'Сурет',
    bucket: 'images',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    mimeByExt: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' },
    maxMB: 10,
    accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    formatsLabel: 'JPG, JPEG, PNG, WEBP',
  },
};

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 600;

export function fileExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function detectType(file: File): MaterialType | null {
  const ext = fileExt(file.name);
  for (const t of Object.keys(TYPE_CONFIG) as MaterialType[]) {
    if (TYPE_CONFIG[t].exts.includes(ext)) return t;
  }
  return null;
}

export type FileCheck = { ok: true; ext: string; mime: string } | { ok: false; error: string };

export function validateFile(type: MaterialType, file: File): FileCheck {
  const cfg = TYPE_CONFIG[type];
  const ext = fileExt(file.name);
  if (!cfg.exts.includes(ext)) {
    return { ok: false, error: `Бұл формат қолданылмайды. ${cfg.label} үшін рұқсат етілген: ${cfg.formatsLabel}.` };
  }
  if (file.size === 0) {
    return { ok: false, error: 'Файл бос. Басқа файлды таңдаңыз.' };
  }
  if (file.size > cfg.maxMB * 1024 * 1024) {
    return { ok: false, error: `Файл тым үлкен (${formatBytes(file.size)}). Ең үлкен көлемі — ${cfg.maxMB} МБ.` };
  }
  return { ok: true, ext, mime: cfg.mimeByExt[ext] };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} ГБ`;
}

const MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

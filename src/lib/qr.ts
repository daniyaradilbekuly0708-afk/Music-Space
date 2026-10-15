import QRCode from 'qrcode';
import type { Material } from '../types';

/** Материалдың тікелей сілтемесі: ашылғанда сол материал бірден ойнайды. */
export function materialLink(m: Pick<Material, 'id'>): string {
  const base = new URL(import.meta.env.BASE_URL || '/', window.location.origin);
  base.searchParams.set('m', m.id);
  return base.toString();
}

/** Сілтемеден материал id-ын оқу. */
export function linkedMaterialId(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('m');
  } catch {
    return null;
  }
}

/** Сілтемедегі ?m= параметрін алып тастау (бетті қайта жүктемей). */
export function clearLinkedMaterial() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('m')) return;
    url.searchParams.delete('m');
    window.history.replaceState(null, '', url.toString());
  } catch {
    /* ignore */
  }
}

const TYPE_LABEL: Record<Material['type'], string> = {
  audio: 'Сканерлеп тыңдаңыз',
  video: 'Сканерлеп көріңіз',
  image: 'Сканерлеп ашыңыз',
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

/**
 * Кітапқа басып шығаруға арналған QR сурет (PNG data URL):
 * жоғарыда PHENOMENON LAB, ортасында QR, астында материал атауы.
 */
export async function printableQr(m: Pick<Material, 'id' | 'title' | 'type'>): Promise<string> {
  const W = 900;
  const QR = 640;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas қолжетімсіз');

  const titleFont = '700 40px Manrope, system-ui, sans-serif';
  ctx.font = titleFont;
  const titleLines = wrapLines(ctx, m.title, W - 120, 3);
  const H = 130 + QR + 60 + titleLines.length * 52 + 90;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#0b1b3f';
  ctx.font = '800 46px Unbounded, Manrope, system-ui, sans-serif';
  ctx.fillText('PHENOMENON LAB', W / 2, 78);
  ctx.fillStyle = '#1679ad';
  ctx.font = '600 24px Manrope, system-ui, sans-serif';
  ctx.fillText('Физика + Музыка + English', W / 2, 112);

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, materialLink(m), {
    width: QR,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b1b3f', light: '#ffffff' },
  });
  ctx.drawImage(qrCanvas, (W - QR) / 2, 130, QR, QR);

  let y = 130 + QR + 64;
  ctx.fillStyle = '#0b1b3f';
  ctx.font = titleFont;
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, y);
    y += 52;
  }
  ctx.fillStyle = '#6b6f8f';
  ctx.font = '600 26px Manrope, system-ui, sans-serif';
  ctx.fillText(TYPE_LABEL[m.type], W / 2, y + 14);

  return canvas.toDataURL('image/png');
}

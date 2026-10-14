/** Видеодан мұқаба суретін автоматты түрде алу (кадр ~1-секунд). */
export function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let finished = false;
    const done = (blob: Blob | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    const timer = window.setTimeout(() => done(null), 10000);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadeddata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 2;
      video.currentTime = Math.min(1, d / 3);
    };
    video.onseeked = () => {
      try {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const w = Math.min(1280, vw);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = Math.round((w * vh) / vw);
        const ctx = canvas.getContext('2d');
        if (!ctx) return done(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => done(b), 'image/jpeg', 0.82);
      } catch {
        done(null);
      }
    };
    video.onerror = () => done(null);
  });
}

/** Бір уақытта тек бір медиа ойнасын: біреуі басталса, қалғандары тоқтайды. */
const EVENT = 'music-space:media-play';

export function announcePlay(id: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: id }));
}

export function onOtherPlay(id: string, pause: () => void): () => void {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail !== id) pause();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

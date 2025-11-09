export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;     // initial quality (0..1)
  minQuality?: number;  // lowest allowed quality
  targetFormat?: 'image/webp' | 'image/jpeg' | 'image/png';
  maxBytes?: number;    // target byte cap
};

export async function compressImageToDataUrl(file: File, opts: CompressOptions = {}) {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.7,
    minQuality = 0.4,
    targetFormat = 'image/webp',
    maxBytes = 280 * 1024,
  } = opts;

  const img = await readImage(file);
  const { width, height, drawWidth, drawHeight } = fit(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

  // Binary search quality to hit maxBytes
  let lo = minQuality, hi = quality, bestDataUrl = '';
  for (let i = 0; i < 8; i++) {
    const q = i === 0 ? quality : (lo + hi) / 2;
    const dataUrl = canvas.toDataURL(targetFormat, q);
    const bytes = dataUrlToBytes(dataUrl);
    if (bytes <= maxBytes) {
      bestDataUrl = dataUrl; lo = q;  // can increase quality
    } else {
      hi = q; // too big -> lower quality
    }
  }
  const dataUrl = bestDataUrl || canvas.toDataURL(targetFormat, minQuality);
  const bytes = dataUrlToBytes(dataUrl);
  return { dataUrl, bytes, width: drawWidth, height: drawHeight, qualityUsed: lo, format: targetFormat };
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fit(w: number, h: number, mw: number, mh: number) {
  const r = Math.min(mw / w, mh / h, 1);
  return { width: w, height: h, drawWidth: Math.round(w * r), drawHeight: Math.round(h * r) };
}

function dataUrlToBytes(dataUrl: string) {
  // data:[mime];base64,XXXX
  const b64 = dataUrl.split(',')[1] || '';
  return Math.ceil((b64.length * 3) / 4);
}

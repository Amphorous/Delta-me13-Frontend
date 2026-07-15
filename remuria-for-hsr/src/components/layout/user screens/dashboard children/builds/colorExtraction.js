// Shared pixel-based colour extraction, factored out of useAvatarPatternBg so
// other per-image colour derivations (e.g. the build detail card's gradient)
// don't reimplement the same canvas read + vibrancy-weighted vote.

export const SAMPLE_SIZE = 64;

// Same Enka AvatarRoundIcon /Series//Avatar/ subfolder inconsistency that
// handleCharacterIconError/handlePfpImgError patch reactively via <img
// onError> — a URL like ".../AvatarRoundIcon/Avatar/1510.png" can 404 even
// though ".../AvatarRoundIcon/1510.png" resolves. This loader builds its own
// off-DOM Image() to read pixels rather than rendering a real <img>, so it
// can't rely on onError and needs the same one-level-up retry itself. Without
// this, a 404 here silently rejects the whole extraction and the caller
// (useCutinGradient) falls back to its neutral gray FALLBACK_GRADIENT_STOPS —
// which is indistinguishable from "the character is just dark-themed" unless
// you already know to suspect a failed fetch.
function nextIconUrlFallback(url) {
  if (url.includes('/AvatarRoundIcon/Series/')) return url.replace('/AvatarRoundIcon/Series/', '/AvatarRoundIcon/');
  if (url.includes('/AvatarRoundIcon/Avatar/')) return url.replace('/AvatarRoundIcon/Avatar/', '/AvatarRoundIcon/');
  return null;
}

async function loadImage(url) {
  let currentUrl = url;
  for (;;) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = currentUrl;
      });
      return img;
    } catch (e) {
      const fallback = nextIconUrlFallback(currentUrl);
      if (!fallback) throw e;
      currentUrl = fallback;
    }
  }
}

export async function loadImagePixels(url, size = SAMPLE_SIZE) {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}

// Buckets pixels by coarse RGB (8 levels/channel) with votes weighted by
// saturation² × closeness-to-centre, then returns the winning bucket's
// weighted-average colour. Transparent corners, near-white/near-black, and
// gray pixels don't vote — grays carry no usable hue, and plain average-based
// extraction (e.g. fast-average-color's default modes) tends to land on a
// washed-out cream for anime portraits, since pale skin/hair pixels vastly
// outnumber the vivid accent pixels.
//
// The centre-distance weighting exists because cutin/splash art conventionally
// centres the character but often surrounds them with decorative environmental
// effects (lantern glow, ambient lighting, particles) that can be MORE
// saturated than the character's own (often more muted) outfit/hair colours —
// e.g. Castorice's actual purple dress lost the vote to a warm gold background
// glow before this was added. Falls back to the plain average if the whole
// image is desaturated (monochrome art), then to a neutral gray if it's
// empty/opaque-free.
export function extractVibrantColor(data, size = SAMPLE_SIZE) {
  const buckets = new Map();
  let avgR = 0, avgG = 0, avgB = 0, avgN = 0;
  const cx = (size - 1) / 2, cy = (size - 1) / 2;
  const maxDist = Math.SQRT2 * (size / 2); // centre -> corner distance, for normalising to 0..1

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // transparent corners
    const r = data[i], g = data[i + 1], b = data[i + 2];
    avgR += r; avgG += g; avgB += b; avgN++;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 510;
    if (l > 0.92 || l < 0.08) continue;
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    if (sat < 0.15) continue;

    const pixelIndex = i / 4;
    const px = pixelIndex % size, py = Math.floor(pixelIndex / size);
    const dist = Math.hypot(px - cx, py - cy) / maxDist; // 0 at centre, 1 at corners
    // Floor of 0.2 rather than 0 — wide poses/outfits do legitimately reach
    // the edges, so edge pixels are heavily discounted, not silenced.
    const centerWeight = Math.max(0.2, 1 - dist);
    const weight = sat * sat * centerWeight;

    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, w: 0 };
    bucket.r += r * weight; bucket.g += g * weight; bucket.b += b * weight; bucket.w += weight;
    buckets.set(key, bucket);
  }

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.w > best.w) best = bucket;
  }
  if (best) return { r: best.r / best.w, g: best.g / best.w, b: best.b / best.w };
  if (avgN) return { r: avgR / avgN, g: avgG / avgN, b: avgB / avgN };
  return { r: 60, g: 60, b: 60 };
}

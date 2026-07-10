import { useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';
import { loadImagePixels, extractVibrantColor } from './colorExtraction';

// 4-stop background gradient for BuildDetailCard, derived from the character's
// cutin art (same vibrancy-weighted extraction as useAvatarPatternBg — see
// colorExtraction.js). Four shades of one hue, light -> dark, so it reads as a
// single cohesive backdrop behind the cutin rather than a mismatched fill.

// imageUrl -> Promise<[string, string, string, string]>; module-scope so
// re-focusing the same build (or another build of the same skin) doesn't
// re-fetch/re-sample the image.
const cache = new Map();

// HSL lightness alone under-corrects for hue: a cyan/yellow reads much
// brighter than a blue/purple at the *same* L (human perceived brightness is
// hue-weighted, not linear in HSL lightness). tinycolor's getBrightness() is
// the YIQ perceived-brightness formula (0-255) — darken in small steps until
// the colour is actually under the ceiling, whatever its hue.
const MAX_PERCEIVED_BRIGHTNESS = 140;
function capBrightness(color, max = MAX_PERCEIVED_BRIGHTNESS) {
  let c = color;
  let guard = 0;
  while (c.getBrightness() > max && guard < 25) {
    c = c.darken(3);
    guard++;
  }
  return c;
}

async function extractGradientStops(imageUrl) {
  const pixels = await loadImagePixels(imageUrl);
  const hsl = tinycolor(extractVibrantColor(pixels)).toHsl();

  // Keep it a background, not a poster: enough saturation to carry the
  // character's colour identity, lightness mid-range so both lighten() and
  // darken() below have room to move without clipping to white/black.
  hsl.s = Math.min(Math.max(hsl.s, 0.35), 0.75);
  hsl.l = Math.min(Math.max(hsl.l, 0.22), 0.45);
  const base = tinycolor(hsl);

  // Cap brightness on each stop individually, not just the shared base —
  // lighten(10) on stop 1 can otherwise push a capped base back over the
  // ceiling for exactly the stop that sits nearest (and most visible behind)
  // the cutin art.
  return [
    capBrightness(base.clone().lighten(10)).toHexString(),
    capBrightness(base.clone().darken(4)).toHexString(),
    capBrightness(base.clone().darken(16)).toHexString(),
    capBrightness(base.clone().darken(30)).toHexString(),
  ];
}

// Returns the 4 gradient stops once extracted, or null while loading / when
// there's no image to sample / extraction fails — caller supplies its own
// neutral fallback gradient in that case.
export default function useCutinGradient(imageUrl) {
  const [stops, setStops] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStops(null);
    if (!imageUrl) return;
    if (!cache.has(imageUrl)) {
      cache.set(imageUrl, extractGradientStops(imageUrl).catch((err) => {
        cache.delete(imageUrl); // let a later mount retry instead of caching the failure
        throw err;
      }));
    }
    cache.get(imageUrl)
      .then((s) => { if (!cancelled) setStops(s); })
      .catch(() => { if (!cancelled) setStops(null); });
    return () => { cancelled = true; };
  }, [imageUrl]);

  return stops;
}

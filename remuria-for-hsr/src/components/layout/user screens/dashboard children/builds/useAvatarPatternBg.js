import { useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';
import { characterIconUrl } from './buildConstants';
import { loadImagePixels, extractVibrantColor } from './colorExtraction';

// Per-avatar background for BuildScrollItem: base = most prominent VIBRANT
// colour of the character icon, overlaid with a checkered dot grid in a
// slightly lightened shade of the same colour (close enough to still read as
// one background, just textured). The dot lattice is rotated 35° counter-
// clockwise and dot radius shrinks right-to-left, which rules out CSS
// repeating gradients (fixed dot size per tile) — the grid is generated as an
// inline SVG data URI.

// avatarId -> Promise<{ backgroundColor, backgroundImage }>; module-scope so
// multiple builds of the same character share one icon fetch + SVG build.
const cache = new Map();

function buildDotsSvg(dotColor) {
  // Fixed-ratio canvas cropped via background-size:cover; slice keeps dots round.
  const W = 300, H = 100;
  const cx = W / 2, cy = H / 2;
  const spacing = 7;
  const rMin = 1.2, rMax = 2.6;
  // 35° counter-clockwise; screen y points down, so CCW is [[cos, sin], [-sin, cos]].
  const angle = (35 * Math.PI) / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);

  let circles = '';
  for (let row = -24; row <= 24; row++) {
    for (let col = -26; col <= 26; col++) {
      // Stagger alternate rows by half a step — the "checkered" offset.
      const lx = col * spacing + (row % 2 ? spacing / 2 : 0);
      const ly = row * spacing;
      const px = cx + lx * cos + ly * sin;
      const py = cy + (-lx * sin + ly * cos);
      if (px < -rMax || px > W + rMax || py < -rMax || py > H + rMax) continue;
      // Radius grows with screen-space x: smallest at the left, largest at the right.
      const t = Math.min(Math.max(px / W, 0), 1);
      const r = (rMin + (rMax - rMin) * t).toFixed(2);
      circles += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><g fill="${dotColor}" fill-opacity="0.55">${circles}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

async function extractPattern(avatarId) {
  const pixels = await loadImagePixels(characterIconUrl(avatarId));
  const hsl = tinycolor(extractVibrantColor(pixels)).toHsl();

  // Normalise into a rich, background-friendly band: enough saturation to
  // clearly differ between characters, lightness held dark so the items sit
  // back as backgrounds (the lighten(12) dots still read against it).
  hsl.s = Math.min(Math.max(hsl.s, 0.55), 0.9);
  hsl.l = Math.min(Math.max(hsl.l, 0.08), 0.14);
  const base = tinycolor(hsl);

  // Dots: a nearby lightened shade of the base so the grid reads as texture on
  // one background, not a second colour.
  const dots = base.clone().lighten(12);

  return {
    // Slight translucency so the strip's backdrop-blur still reads through.
    backgroundColor: base.clone().setAlpha(0.92).toRgbString(),
    backgroundImage: buildDotsSvg(dots.toRgbString()),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

// Returns the style object once extracted, or null while loading / when colour
// extraction fails (icon 404, CORS) — caller keeps its fallback background then.
export default function useAvatarPatternBg(avatarId) {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStyle(null);
    if (!cache.has(avatarId)) {
      cache.set(avatarId, extractPattern(avatarId).catch((err) => {
        cache.delete(avatarId); // let a later mount retry instead of caching the failure
        throw err;
      }));
    }
    cache.get(avatarId)
      .then((s) => { if (!cancelled) setStyle(s); })
      .catch(() => { if (!cancelled) setStyle(null); });
    return () => { cancelled = true; };
  }, [avatarId]);

  return style;
}

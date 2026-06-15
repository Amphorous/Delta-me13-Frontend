import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectThemeKey, selectBackgroundImageKey, selectCardBackgroundImageKey, selectPillColorMode } from '../store/settingsSlice';
import { backgroundImages, cardBackgroundImages } from '../assets/backgroundImages';
import { FastAverageColor } from 'fast-average-color';
import tinycolor from 'tinycolor2';

// ── Static palettes ────────────────────────────────────────────────────────────
// Each palette needs: solid (main accent), muted (lighter variant for borders/icons),
// text (very light for text on accent bg), colon (brand colon opacity).

const PALETTES = {
  purple: {
    solid:  '#8b5cf6',   // violet-500
    muted:  '#a78bfa',   // violet-400
    text:   '#f3e8ff',   // purple-100
    colon:  'rgb(139 92 246 / 0.5)',
  },
  red: {
    solid:  '#f43f5e',   // rose-500
    muted:  '#fb7185',   // rose-400
    text:   '#ffe4e6',   // rose-100
    colon:  'rgb(244 63 94 / 0.5)',
  },
  green: {
    solid:  '#10b981',   // emerald-500
    muted:  '#34d399',   // emerald-400
    text:   '#d1fae5',   // emerald-100
    colon:  'rgb(16 185 129 / 0.5)',
  },
};

function rgba(hex, alpha) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function buildVars({ solid, muted, text, colon }) {
  return {
    '--accent-solid':     solid,
    '--accent-muted':     muted,
    '--accent-text':      text,
    '--accent-colon':     colon,
    '--accent-ring':      solid,
    '--accent-bg-20':     rgba(solid, 0.2),
    '--accent-bg-30':     rgba(solid, 0.3),
    '--accent-bg-40':     rgba(solid, 0.4),
    '--accent-bg-60':     rgba(solid, 0.6),
    '--accent-border-30': rgba(muted, 0.3),
    '--accent-border-60': rgba(muted, 0.6),
    // Glass tinge — painted as an inset box-shadow over all backdrop-blur panels (see index.css)
    '--accent-glass':     rgba(solid, 0.12),
    // Dim muted — for subtle themed text (footer labels, etc.)
    '--accent-dim':       rgba(muted, 0.35),
  };
}

async function deriveAccentColors(imageUrl) {
  const fac = new FastAverageColor();
  const result = await fac.getColorAsync(imageUrl, { algorithm: 'dominant' });
  const hsl = tinycolor(result.hex).toHsl();

  // Ensure the extracted colour is vivid enough to use as an accent
  if (hsl.s < 0.35) hsl.s = 0.55;
  if (hsl.l < 0.38) hsl.l = 0.52;
  if (hsl.l > 0.72) hsl.l = 0.60;

  const base  = tinycolor(hsl);
  const muted = tinycolor({ ...hsl, l: Math.min(hsl.l + 0.14, 0.8) });
  const text  = tinycolor({ ...hsl, s: Math.max(hsl.s - 0.15, 0), l: Math.min(hsl.l + 0.36, 0.94) });

  return {
    solid: base.toHexString(),
    muted: muted.toHexString(),
    text:  text.toHexString(),
  };
}

async function deriveAdaptivePalette(imageUrl) {
  try {
    const { solid, muted, text } = await deriveAccentColors(imageUrl);
    return buildVars({ solid, muted, text, colon: rgba(solid, 0.5) });
  } catch {
    return buildVars(PALETTES.purple);
  }
}

function applyVars(vars) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

export default function ThemeManager() {
  const themeKey        = useSelector(selectThemeKey);
  const bgKey           = useSelector(selectBackgroundImageKey);
  const cardBgKey       = useSelector(selectCardBackgroundImageKey);
  const pillColorMode   = useSelector(selectPillColorMode);

  useEffect(() => {
    if (themeKey !== 'adaptive') {
      applyVars(buildVars(PALETTES[themeKey] ?? PALETTES.purple));
      return;
    }

    const bgImage = backgroundImages.find(b => b.key === bgKey) ?? backgroundImages[0];
    if (!bgImage) {
      applyVars(buildVars(PALETTES.purple));
      return;
    }

    deriveAdaptivePalette(bgImage.url).then(applyVars);
  }, [themeKey, bgKey]);

  // Pill selector accent — only sampled from the card background when the
  // "card" pill colour mode is active. "theme" reuses --accent-*, "bw" is
  // handled entirely in Cursor/Tab with no CSS variables.
  useEffect(() => {
    if (pillColorMode !== 'card') return;

    const cardImage = cardBackgroundImages.find(b => b.key === cardBgKey) ?? cardBackgroundImages[0];
    if (!cardImage) {
      applyVars(buildVars(PALETTES.purple));
      return;
    }

    deriveAccentColors(cardImage.url)
      .then(({ solid, text }) => applyVars({ '--pill-accent-solid': solid, '--pill-accent-text': text }))
      .catch(() => applyVars({ '--pill-accent-solid': PALETTES.purple.solid, '--pill-accent-text': PALETTES.purple.text }));
  }, [pillColorMode, cardBgKey]);

  return null;
}

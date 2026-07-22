import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { CgSpinner } from 'react-icons/cg';
import { FaRegFaceAngry } from 'react-icons/fa6';
import tinycolor from 'tinycolor2';
import { characterIconUrl, enkaUiUrl, getSkinList, pathIconUrl, elementIconUrl, weaponNameFontOptionsForLocale, FONT_OPTIONS_BY_LOCALE, defaultBuildStatFontClass, defaultBuildStatValueFontClass, fetchStatNames, deriveDisplayStats, statIconGetter } from './buildConstants';
import useCutinGradient from './useCutinGradient';
import { useTranslatedHash } from '../../../../../utils/hashTranslation';
import { rarityTextColor } from '../../../../../utils/rarityColors';
import { selectRankIconShimmer, selectHideBuildIdentity, selectBuildCardStarfield, selectNameOverflowScrollMode, selectWeaponNameFontClass, selectBuildStatFontClass, selectBuildStatValueFontClass } from '../../../../../store/settingsSlice';
import { selectLoc } from '../../../../../store/localisationSlice';
import selectBuildPlaceholder from '../../../../../assets/Select a build bozo.png';

// The card splits into 3 top-level regions, left to right: the cutin/level-tag
// negative-space strip, the info panel (cutouts-being-made), and the name
// panel. NAME_PANEL_WIDTH_PCT is a fixed % of the whole card and is NOT
// derived from the other two — the name panel is a direct sibling of the info
// panel (see the JSX below) rather than nested inside it, specifically so
// resizing the info panel/cutin split can never eat into the name panel's own
// width.
// INFO_PANEL_WIDTH_CLASS and CUTIN_STRIP_WIDTH_CLASS must sum to 100% with
// each other, but that 100% is "whatever's left after the name panel" (the
// info-panel wrapper's own flex-1 region), NOT literally 100% of the card —
// the z-0 negative-space layer (starfield/cutin/level-tag) has to match that
// same flex-1 width, or its CUTIN_STRIP_WIDTH_CLASS-wide cutin-centring strip
// silently drifts out of alignment with where the info panel's own visible
// edge actually renders (this exact drift is what caused a previously-fixed,
// pixel-centred cutin — e.g. 1415 — to look mis-centred again after the name
// panel was carved out). NAME_PANEL_WIDTH_PCT is a plain number (not a
// Tailwind class) specifically so the z-0 layer's own width can be computed
// from it via inline style (`calc(100% - Npct%)`) — Tailwind classes can't be
// built from a runtime split like that (the JIT scanner only generates CSS
// for literal class strings in source), and a second hardcoded literal here
// would just reintroduce the same two-places-to-update problem.
// INFO_PANEL_WIDTH_CLASS/CUTIN_STRIP_WIDTH_CLASS stay literal Tailwind classes
// since they only ever need their own single percentage, not a combination.
const NAME_PANEL_WIDTH_PCT = 10;
const INFO_PANEL_WIDTH_CLASS = 'w-[75%]';
const CUTIN_STRIP_WIDTH_CLASS = 'w-[25%]'; // must sum to 100% with INFO_PANEL_WIDTH_CLASS above

// Vertex (corner) notches, positioned at the 4 corners of the
// "cutouts-being-made" panel but *applied* to the outermost build-detail-card
// element — so each notch punches all the way through every stacked layer
// (gradient, cutin, blur panel) instead of just carving cutouts-being-made's
// own backdrop-blur and leaving the gradient/cutin visible underneath it.
// Each notch is a radial-gradient circle whose *centre* sits exactly on the
// corner it cuts — since only the inward quarter of the circle falls inside
// the element, that alone yields the quarter-circle bite with no separate
// clipping step (same trick BuildScrollItem's ticket-stub notches use for the
// top/bottom edge).
// cutouts-being-made is narrower than build-detail-card (it's nested inside
// the info panel — see INFO_PANEL_WIDTH_CLASS — flush to that panel's left
// edge), so its corners
// don't sit at a fixed 0%/100% of the outer card — their position has to be
// measured relative to the card, not assumed.
const CORNER_NOTCH_RADIUS = 10; // px

// Font size/family for the STATS/SKILLS/ORNAMENTS watermarks.
const WATERMARK_FONT_SIZE = 90;
const WATERMARK_FONT_FAMILY = '"Badeen Display", sans-serif';

function radialNotch(shape, position) {
  return `radial-gradient(${shape} at ${position}, transparent 99%, #000 100%)`;
}

// Mirrors CutoutUtil's mask compositing: every layer intersects with the
// accumulated result (carving out its own hole) except the last, which has to
// seed the canvas via add/source-over.
function buildNotchMaskStyle(layers) {
  if (!layers.length) return {};
  const composites = layers.map(() => 'intersect');
  const webkitComposites = layers.map(() => 'source-in');
  composites[composites.length - 1] = 'add';
  webkitComposites[webkitComposites.length - 1] = 'source-over';
  return {
    WebkitMaskImage: layers.join(', '),
    maskImage: layers.join(', '),
    WebkitMaskComposite: webkitComposites.join(', '),
    maskComposite: composites.join(', '),
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };
}

// Static, unmeasured twin of the same notch shape — applied directly on
// cutouts-being-made so ITS OWN backdrop-blur paint is punched at the same 4
// corners the outer mask cuts. Without this, the blur panel (stacked on top
// of the outer card) simply paints solid glass right over the hole the outer
// mask carves, hiding it again — masking an ancestor clips that ancestor's
// own painted content, but a descendant's own backdrop-filter is composited
// independently and isn't reliably cut by an ancestor's mask in practice.
// Corners here are always 0%/100% of the element's OWN box (no cross-div
// measurement needed, unlike the outer mask which has to locate this div's
// corners relative to a bigger sibling box).
const LOCAL_CORNER_MASK_STYLE = buildNotchMaskStyle([
  radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '0% 0%'),
  radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '100% 0%'),
  radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '0% 100%'),
  radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '100% 100%'),
]);

// Rank ring border bites, sized as ratios of the ring's own measured width.
const RANK_ICON_TO_RING_RATIO = (32 / 44) * 0.9;
// Radius ratio; 0.5 reaches the ring's own edge, 0.47 sits just inside it.
const RANK_CUTOUT_TO_RING_RATIO = 0.47;
// Ring's own small border bite, independent of the cutout ratio above.
const RANK_SOCKET_NOTCH_TO_RING_RATIO = (7 / 44) * 0.8;

// Corner bite for the weapon-art "stacked glass card" frame — same notch idiom
// as the other masks above, just a smaller radius to suit the weapon image's
// own smaller box.
const WEAPON_CARD_NOTCH_RADIUS = 6; // px
const WEAPON_CARD_NOTCH_MASK_STYLE = buildNotchMaskStyle([
  radialNotch(`circle ${WEAPON_CARD_NOTCH_RADIUS}px`, '0% 0%'),
  radialNotch(`circle ${WEAPON_CARD_NOTCH_RADIUS}px`, '100% 0%'),
  radialNotch(`circle ${WEAPON_CARD_NOTCH_RADIUS}px`, '0% 100%'),
  radialNotch(`circle ${WEAPON_CARD_NOTCH_RADIUS}px`, '100% 100%'),
]);

// "click" sits centred on the front pane's inner border's bottom edge — same
// notch idiom as the corner bites above (a single radialNotch layer, so there's
// no multi-layer composite math to get wrong), just an ellipse positioned at
// the edge midpoint instead of a circle at a corner, sized to roughly the
// label's own footprint (approximate; tune alongside the label's font size if
// it doesn't quite line up).
const WEAPON_CLICK_LABEL_NOTCH_RADII = '16px 6px'; // x-radius y-radius
const WEAPON_CLICK_LABEL_MASK_STYLE = buildNotchMaskStyle([
  radialNotch(`ellipse ${WEAPON_CLICK_LABEL_NOTCH_RADII}`, '50% 100%'),
]);

// Weapon-card pointer tilt + flip. `perspective` is the 3D viewing distance in
// px (smaller = more dramatic foreshortening); MAX_DEG caps how far the whole
// card rotates toward the pointer; BASE_OFFSET_PCT is how far each glass pane
// sits from the image at rest; PARALLAX_PX is how much further the front/back
// panes slide along that same diagonal at full tilt — this growing separation
// between the panes and the (non-translating) image between them is what
// actually reads as parallax rather than a single flat tilt. The spring
// config is shared between the ambient tilt and the flip animation (see the
// flip motion.div in the JSX) so both feel like the same object.
const WEAPON_TILT_PERSPECTIVE_PX = 800;
const WEAPON_TILT_MAX_DEG = 5;
const WEAPON_PANE_BASE_OFFSET_PCT = 1;
const WEAPON_TILT_PARALLAX_PX = 3;
const WEAPON_TILT_SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

// Flip sequencing: rather than rotating the glass panes in true 3D along with
// the image (which clipped weirdly against their masks/borders as they
// crossed edge-on), the panes fade to 0, snap to their post-flip corner while
// invisible, then fade back in — same idea as a cross-fade, just gated on the
// image's own flip completing so nothing pops mid-rotation.
const WEAPON_FLIP_FADE_MS = 150;
const WEAPON_FLIP_SETTLE_MS = 450; // rough settle time for the flip-pivot's spring below

// Neutral placeholder while the cutin's gradient is still being sampled (or
// there's no cutin to sample at all) — same 4-stop shape as the real thing,
// just desaturated, so there's no flash-of-different-layout on load.
const FALLBACK_GRADIENT_STOPS = ['#3f3f46', '#27272a', '#18181b', '#09090b'];

// Same idea, vertical axis — a handful of cutins sit slightly high/low in
// their own frame regardless of horizontal centring.
const CUTIN_TOP_DEFAULT = 'top-0';
const CUTIN_TOP_BY_AVATAR = {
  1506: 'top-[4%]',
};

// Deliberate one-off horizontal nudges, added only on explicit request for a
// specific character whose art still looks off after true strip-centring —
// NOT a routine per-character table (that's the exact thing removed in favour
// of left-1/2 centring). Expressed as % of the cutin box's OWN width, the same
// frame -translate-x-1/2 already uses, so it stays correct regardless of the
// info-panel/cutin-strip split ratio — unlike the old CUTIN_LEFT_BY_AVATAR
// values (% of card), this never needs re-deriving if that ratio changes.
const CUTIN_NUDGE_BY_AVATAR = {
  1301: -5, // shifted left a bit on request
  1106: 10,
  1502: 5,
  1408: 3,
  1409: -10,
};

// Global zoom applied to every cutin's <img> (1 = no zoom, >1 zooms in, <1
// zooms out). Since the img is already sized to exactly fill its box
// (object-cover, w-full h-full), scaling it via transform — rather than e.g.
// resizing the box itself — enlarges/shrinks it in place: CSS's default
// transform-origin is 50% 50% (the element's own centre), so the zoom is
// anchored on the image's own centre point with no extra transform-origin
// needed, and the box (and everything positioned from it — the level tag,
// the strip centring) is completely unaffected.
const CUTIN_ZOOM = 1.1;

const GRADIENT_OVERRIDE_BY_AVATAR = {
  1220: ['#2fb8a8', '#1f8d84', '#12615e', '#073634'], // turquoise green-blue
  1301: ['#6b1f2a', '#4a141d', '#2a0a10', '#080304'], // deep wine red -> black
  1408: ['#94a3b8', '#475569', '#1e293b', '#020617'], // cool gray -> black
  1414: ['#14746b', '#0d4e47', '#082e2a', '#020806'], // deep jade-teal -> black (robe/sash, not the gold backdrop motif)
  1415: ['#16245c', '#3f2b7d', '#83377f', '#c25585'], // deep blue -> pink
  1510: ['#350403', '#6a0706', '#6a0706', '#9f0b09'], // himkin 000100
  //1510: ['#350403', '#6a0706', '#9f0b09', '#d30e0c'], // himkin 000100
};

const STARFIELD_AVATAR_ID = 1510;
const STARFIELD_COUNT = 2000;
const STARFIELD_MIN_SIZE = 1.5; // px
const STARFIELD_MAX_SIZE = 4.5; // px
const STARFIELD_MIN_OPACITY = 0.3;
const STARFIELD_MAX_OPACITY = 0.7;
// as one shape stamped many times.
const STARFIELD_MIN_WAIST = 7;
const STARFIELD_MAX_WAIST = 17;
// side instead of vanishing.
const STARFIELD_WHITE_ZONE_PCT = 90;

function starClipPath(waist) {
  const near = 50 - waist;
  const far = 50 + waist;
  return `polygon(50% 0%, ${far}% ${near}%, 100% 50%, ${far}% ${far}%, 50% 100%, ${near}% ${far}%, 0% 50%, ${near}% ${near}%)`;
}

// White up to STARFIELD_WHITE_ZONE_PCT, then linearly fades to black by the
// right edge — a plain per-channel lerp (white and black share all 3
// channels, so one grayscale value covers it) rather than pulling in a colour
// library for a single-axis fade.
function starColorForLeftPct(leftPct) {
  if (leftPct <= STARFIELD_WHITE_ZONE_PCT) return '#ffffff';
  const t = Math.min((leftPct - STARFIELD_WHITE_ZONE_PCT) / (100 - STARFIELD_WHITE_ZONE_PCT), 1);
  const channel = Math.round(255 * (1 - t)).toString(16).padStart(2, '0');
  return `#${channel}${channel}${channel}`;
}

function generateStarfield() {
  return Array.from({ length: STARFIELD_COUNT }, () => {
    const leftPct = Math.random() * 100;
    return {
      left: `${leftPct.toFixed(2)}%`,
      top: `${(Math.random() * 100).toFixed(2)}%`,
      size: STARFIELD_MIN_SIZE + Math.random() * (STARFIELD_MAX_SIZE - STARFIELD_MIN_SIZE),
      opacity: STARFIELD_MIN_OPACITY + Math.random() * (STARFIELD_MAX_OPACITY - STARFIELD_MIN_OPACITY),
      // 0-90deg covers every unique orientation of a 4-point star (90° rotational symmetry).
      rotation: Math.random() * 90,
      clipPath: starClipPath(STARFIELD_MIN_WAIST + Math.random() * (STARFIELD_MAX_WAIST - STARFIELD_MIN_WAIST)),
      color: starColorForLeftPct(leftPct),
    };
  });
}

const NAME_FIT_MIN_SCALE = 0.4; // shrink floor before falling back to a 2nd column
const NAME_FIT_WRAP_SCALE = 0.5; // extra shrink applied once wrapped (2 columns need more combined width than 1 — some fonts, e.g. Press Start 2P, are wide enough per-glyph that a mild reduction here still overflows)
// Single-column shrink is computed as an EXACT fit (rawScale below), which
// leaves the text flush against the row's edges with no breathing room —
// this knocks a further 10% off just that case so there's some visible
// padding. Wrap sizing (NAME_FIT_WRAP_SCALE) is deliberately untouched.
const NAME_FIT_SINGLE_LINE_PADDING = 0.9;

// Weapon name label's own (less aggressive) fit tuning — passed to
// useVerticalNameFit instead of the NAME_FIT_* defaults above, so the
// character name panel's already-tuned behaviour is untouched. Bold display
// text spanning the lightcone reads better prone to wrapping into a 2nd
// column while staying large, rather than shrinking way down to stay
// single-column like the character name does.
const WEAPON_NAME_FIT_MIN_SCALE = 0.7;
const WEAPON_NAME_FIT_WRAP_SCALE = 0.75;
const WEAPON_NAME_FIT_SINGLE_LINE_PADDING = 1; // no extra shrink — let it fill/span fully

// Vertical (writing-mode: vertical-lr) name text has no CSS-native "shrink to
// fit": font-size drives the run's total HEIGHT here (height is the inline
// axis in vertical mode), so a name that's too long just overflows straight
// past the row unless something intervenes. This measures a hidden,
// always-at-scale-1 clone of the (always-rendered) main name span against
// the row's actual available height, and returns how the VISIBLE layered
// spans should compensate: shrink evenly if that's enough on its own, or
// shrink to a fixed floor AND wrap into a second vertical column (removing
// whitespace-nowrap, letting the browser's own line-breaking wrap at a
// space) if even the floor scale isn't enough.
// Measuring a hidden, unscaled clone — rather than the visible (already
// possibly-scaled) spans themselves — avoids a feedback loop: measuring an
// already-shrunk element would read as "it fits now", reset to scale 1, then
// overflow again next tick, forever oscillating.
// minScale/wrapScale/singleLinePadding default to the character-name-panel
// tuning above, but are overridable per caller — the weapon name label uses
// deliberately less-aggressive values (see WEAPON_NAME_FIT_* below) so it
// stays big/bold rather than shrinking down small before it'll wrap.
function useVerticalNameFit(containerRef, measureRef, text, enabled, {
  minScale = NAME_FIT_MIN_SCALE,
  wrapScale = NAME_FIT_WRAP_SCALE,
  singleLinePadding = NAME_FIT_SINGLE_LINE_PADDING,
} = {}) {
  const [fit, setFit] = useState({ scale: 1, wrap: false });

  useLayoutEffect(() => {
    if (!enabled) {
      setFit({ scale: 1, wrap: false });
      return;
    }
    const containerEl = containerRef.current;
    const measureEl = measureRef.current;
    if (!containerEl || !measureEl) return;

    const measure = () => {
      const containerHeight = containerEl.getBoundingClientRect().height;
      const textHeight = measureEl.getBoundingClientRect().height;
      if (!containerHeight || !textHeight) return;

      if (textHeight <= containerHeight) {
        setFit({ scale: 1, wrap: false });
        return;
      }
      const rawScale = containerHeight / textHeight;
      setFit(rawScale >= minScale
        ? { scale: rawScale * singleLinePadding, wrap: false }
        : { scale: wrapScale, wrap: true });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerEl);
    observer.observe(measureEl);
    return () => observer.disconnect();
  }, [enabled, text, containerRef, measureRef, minScale, wrapScale, singleLinePadding]);

  return fit;
}

// Measures a watermark word in Canvas and returns an SVG transform that
// lands its tight ink bounds flush at y:[0,100] of a 500x100 viewBox.
function useWatermarkTextTransform(text, fontSize, fontFamily, dep) {
  const [transform, setTransform] = useState('');
  useLayoutEffect(() => {
    const measure = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `100 ${fontSize}px ${fontFamily}`;
      const m = ctx.measureText(text);
      const tightHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      if (!tightHeight) return;
      const scaleY = 100 / tightHeight;
      const translateY = scaleY * m.actualBoundingBoxAscent;
      setTransform(`translate(0, ${translateY}) scale(1, ${scaleY})`);
    };
    measure();
    // Re-measure once the webfont finishes loading in case it swapped in late.
    document.fonts?.ready?.then(measure);
  }, [dep, text, fontSize, fontFamily]);
  return transform;
}

// Post-extraction tone adjustments for characters whose extracted HUE is right
// but the tone is off — full overrides above are for when the hue itself is
// wrong. Applied per stop to the sampled gradient.
const GRADIENT_ADJUST_BY_AVATAR = {
  1412: { saturate: 16, darken: 18 }, // deeper and darker (bumped twice now)
  1506: { saturate: 6, darken: 22 },  // considerably darken, then deepened further
};

// Fixed STATS/ORNAMENTS watermark colour override per avatar. Skills is untouched.
const WATERMARK_GOLD_BY_AVATAR = {
  1510: '#B8860B',
};

// Avatars whose stat row bars are darker and more opaque than normal, even more so on hover.
const DARK_STAT_ROW_AVATARS = new Set(['1510', '1415']);

// League Gothic/Holiday are Latin display faces with no glyphs for these
// scripts, so locales that need them get a single substitute layer instead
// of the two-layer Latin treatment (see the name JSX below) — a different
// face per locale rather than one shared font, since JP/KR/CN/TW/TH/RU don't
// share a script and no single face covers all of them well. This same map
// also decides which locales fall back to barcoding the raw name hash
// instead of the translated name (see the barcode JSX further down) — none
// of these scripts (Cyrillic included — Russian genuinely isn't recognised by
// Libre Barcode 39 either) render as recognisable barcode stripes.
const NAME_FONT_CLASS_BY_LOCALE = {
  jp: 'dotgothic16-font',
  kr: 'gasoek-one-font',
  cn: 'liu-jian-mao-cao-font',
  tw: 'liu-jian-mao-cao-font',
  th: 'pattaya-font',
  ru: 'press-start-2p-font',
};

// Stat row glass box accent colour, keyed by stat type substring.
function statRowAccentColor(type) {
  const t = type.toLowerCase();
  if (t.includes('attack')) return '#ef4444';
  if (t.includes('defence')) return '#3b82f6';
  if (t.includes('hp') || t.includes('heal')) return '#22c55e';
  if (t.includes('thunder')) return '#ce69e6';
  if (t.includes('wind')) return '#79d09c';
  if (t.includes('quantum')) return '#6862c8';
  if (t.includes('physical')) return '#666667';
  if (t.includes('imaginary')) return '#f7e548';
  if (t.includes('ice')) return '#43a6df';
  if (t.includes('fire')) return '#ed3d38';
  if (t.includes('elation')) return '#eab308';
  return null;
}

function BuildDetailCard({ build, skinIndex = 0, onPathFilterClick, onElementFilterClick }) {
  const rankIconShimmerEnabled = useSelector(selectRankIconShimmer);
  const hideBuildIdentity = useSelector(selectHideBuildIdentity);
  const starfieldEnabled = useSelector(selectBuildCardStarfield);
  const nameOverflowScrollMode = useSelector(selectNameOverflowScrollMode);
  const locale = useSelector(selectLoc);
  // Settings > Build's picker stores the user's manual choice (null = never
  // set); falls back to the active locale's own default whenever that's null
  // or isn't one of the options offered for the CURRENT locale (e.g. a font
  // picked while on Korean isn't necessarily valid once switched to English)
  // — see weaponNameFontOptionsForLocale in buildConstants.js.
  const weaponNameFontSetting = useSelector(selectWeaponNameFontClass);
  const weaponNameFontOptions = weaponNameFontOptionsForLocale(locale);
  const weaponNameFontClass = weaponNameFontOptions.some(o => o.value === weaponNameFontSetting)
    ? weaponNameFontSetting
    : weaponNameFontOptions[0].value;
  // Build Stats Font setting, drives stat labels and the card-back lightcone name.
  const buildStatFontSetting = useSelector(selectBuildStatFontClass);
  const buildStatFontOptions = weaponNameFontOptionsForLocale(locale);
  const statLabelFontClass = buildStatFontOptions.some(o => o.value === buildStatFontSetting)
    ? buildStatFontSetting
    : defaultBuildStatFontClass(locale);
  // Card-back lightcone name font is its own fixed rule, independent of the stat font setting.
  const weaponBackNameFontClass = FONT_OPTIONS_BY_LOCALE[locale]
    ? weaponNameFontOptionsForLocale(locale)[0].value
    : 'afacad-bold';
  const statLabelWrapClass = 'whitespace-normal break-words leading-tight';
  // jp/kr/cn fonts and Afacad Bold read smaller than other Latin options at the same size.
  const statLabelFontSizeClass = statLabelFontClass === 'afacad-bold'
    ? 'text-[4.8cqh]'
    : statLabelFontClass === 'press-start-2p-font'
      ? 'text-[3.2cqh]'
      : ['jp', 'kr', 'cn'].includes(locale)
        ? 'text-[4.4cqh]'
        : 'text-[4cqh]';
  // Press Start 2P reads fine with a bigger shadow offset, other fonts need a smaller one.
  const statLabelShadowOffset = statLabelFontClass === 'press-start-2p-font' ? '0.06em' : '0.04em';

  // Build Stat Values Font setting, independent from the label font above.
  const buildStatValueFontSetting = useSelector(selectBuildStatValueFontClass);
  const statValueFontClass = buildStatFontOptions.some(o => o.value === buildStatValueFontSetting)
    ? buildStatValueFontSetting
    : defaultBuildStatValueFontClass(locale);
  const statValueShadowOffset = statValueFontClass === 'press-start-2p-font' ? '0.06em' : '0.04em';

  // Character stat panel — statNames is the /hsr/stat-names/{locale} map
  // (module-scope cached per locale by fetchStatNames itself, so this just
  // re-reads the shared cache whenever locale changes rather than re-fetching).
  // deriveDisplayStats falls back to the offline English STAT_ALIASES labels
  // via statLabel whenever statNames is still null (first load) or missing a
  // key, so there's no unlocalised/blank flash — just a brief English one.
  const [statNames, setStatNames] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchStatNames(locale).then(names => { if (!cancelled) setStatNames(names); });
    return () => { cancelled = true; };
  }, [locale]);
  const displayStats = useMemo(
    () => deriveDisplayStats(build?.fightProps?.stats, statNames),
    [build?.fightProps?.stats, statNames]
  );

  const statsTextTransform = useWatermarkTextTransform('STATS', WATERMARK_FONT_SIZE, WATERMARK_FONT_FAMILY, build?.id);
  const skillsTextTransform = useWatermarkTextTransform('SKILLS', WATERMARK_FONT_SIZE, WATERMARK_FONT_FAMILY, build?.id);
  const ornamentsTextTransform = useWatermarkTextTransform('ORNAMENTS', WATERMARK_FONT_SIZE, WATERMARK_FONT_FAMILY, build?.id);

  // The dashboard-page account being viewed, not this build's own data —
  // same store slice + access pattern UserCard/UserLongCard/Dashboard use.
  const focusedUser = useSelector(state => state.focusedUser);
  // null for locales that use the regular League Gothic/Holiday treatment.
  const localeFontClass = NAME_FONT_CLASS_BY_LOCALE[locale] ?? null;
  const captureRef = useRef(null);
  const cutoutsRef = useRef(null);
  const [cornerMaskStyle, setCornerMaskStyle] = useState({});
  // One ref per rank socket (populated via callback ref in the JSX below) and
  // the measured {leftPct, topPct} centre of each, relative to the outer
  // card — see the rankSocketRefs useLayoutEffect further down for why the
  // icons themselves render from this instead of just living inside the
  // socket divs.
  const rankSocketRefs = useRef([]);
  const [rankIconRects, setRankIconRects] = useState([]);
  // Ring's own border-bite mask, computed from the same measured ring width as the cutout hole.
  const [rankSocketNotchMaskStyle, setRankSocketNotchMaskStyle] = useState({});
  // cutouts-being-made's own mask: the 4 static corner notches plus a hole
  // tracked to each ring's measured centre (see the rankSocketRefs
  // useLayoutEffect further down). Defaults to just the corners so they
  // still show before the first measurement pass.
  const [localMaskStyle, setLocalMaskStyle] = useState(LOCAL_CORNER_MASK_STYLE);

  // Weapon-card pointer tilt: raw pointer position normalised to -1..1 within
  // the card's own box, spring-smoothed so the tilt eases rather than
  // snapping to the cursor. Only applied to the outer wrapper (see JSX) — the
  // image inherits this rotation for free via ordinary CSS transform
  // composition ("just pivots"), while the glass panes additionally slide
  // further apart as tilt grows (see weaponParallaxPx below).
  const weaponPointerX = useMotionValue(0);
  const weaponPointerY = useMotionValue(0);
  const weaponTiltX = useSpring(weaponPointerX, WEAPON_TILT_SPRING);
  const weaponTiltY = useSpring(weaponPointerY, WEAPON_TILT_SPRING);
  const weaponRotateY = useTransform(weaponTiltX, [-1, 1], [-WEAPON_TILT_MAX_DEG, WEAPON_TILT_MAX_DEG]);
  const weaponRotateX = useTransform(weaponTiltY, [-1, 1], [WEAPON_TILT_MAX_DEG, -WEAPON_TILT_MAX_DEG]);
  const weaponTiltMagnitude = useTransform([weaponTiltX, weaponTiltY], ([tx, ty]) => Math.min(Math.hypot(tx, ty), 1));
  const weaponParallaxPx = useTransform(weaponTiltMagnitude, [0, 1], [0, WEAPON_TILT_PARALLAX_PX]);

  // Weapon-card flip: no real "back" art exists for a light cone, so flipping
  // just reveals a plain placeholder canvas in its place — free-form div,
  // fill with whatever info is wanted later.
  const [isWeaponFlipped, setIsWeaponFlipped] = useState(false);
  // Card-back stats toggle: off shows this equip's actual current-level/
  // refinement stats (EquipsWeaponRelationship.baseAtk/baseDefence/baseHP);
  // on shows the weapon's own max (lvl 80 / superimposition 6) stats, which
  // live on WeaponNode itself (baseAttack/baseDefense/baseHP — note the
  // different property names/spelling between the two, that's not a typo).
  const [isWeaponMaxStats, setIsWeaponMaxStats] = useState(false);

  // Tilt is ignored entirely while showing the back — handleWeaponFlipClick
  // also eases the underlying pointer values back to 0 the moment a flip-to-back
  // starts, so the card settles flat via the same spring rather than freezing
  // wherever the cursor happened to be.
  function handleWeaponPointerMove(e) {
    if (isWeaponFlipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    weaponPointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    weaponPointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function handleWeaponPointerLeave() {
    weaponPointerX.set(0);
    weaponPointerY.set(0);
  }

  // weaponFlipCorner (0 pre-flip / 1 post-flip) snaps instantly — it's only
  // ever changed while paneOpacity is at 0, so the corner jump itself is
  // never seen, just the fade/reposition/fade-back sequence in
  // handleWeaponFlipClick below.
  // Front pane keeps sharing one x/y value (its diagonal stays symmetric:
  // top-left pre-flip, bottom-right post-flip). The back pane's x and y
  // diverge post-flip (top-right instead of the mirrored bottom-left true 3D
  // rotation would give it), so it needs two independent values — this
  // asymmetry is a deliberate choice, not derived from the flip's geometry.
  const weaponFlipCorner = useMotionValue(0);
  const paneOpacity = useMotionValue(1);
  const weaponFrontOffset = useTransform(
    [weaponParallaxPx, weaponFlipCorner],
    ([px, flip]) => `calc(${flip ? '+' : '-'}${WEAPON_PANE_BASE_OFFSET_PCT}% ${flip ? '+' : '-'} ${px}px)`
  );
  const weaponBackX = useTransform(weaponParallaxPx, (px) => `calc(${WEAPON_PANE_BASE_OFFSET_PCT}% + ${px}px)`);
  const weaponBackY = useTransform(
    [weaponParallaxPx, weaponFlipCorner],
    ([px, flip]) => `calc(${flip ? '-' : '+'}${WEAPON_PANE_BASE_OFFSET_PCT}% ${flip ? '-' : '+'} ${px}px)`
  );

  function handleWeaponFlipClick() {
    const nextFlipped = !isWeaponFlipped;
    if (nextFlipped) {
      // Flipping to the back: ease the tilt back to neutral via the same
      // spring (rather than freezing wherever the cursor last was) — pointer
      // moves are ignored from here on (see handleWeaponPointerMove) until
      // it's unflipped again.
      weaponPointerX.set(0);
      weaponPointerY.set(0);
    }
    animate(paneOpacity, 0, { duration: WEAPON_FLIP_FADE_MS / 1000 }).then(() => {
      weaponFlipCorner.set(nextFlipped ? 1 : 0);
      setIsWeaponFlipped(nextFlipped);
      // Panes stay hidden while showing the back — only fade back in once
      // unflipped, and only after giving the image's own flip spring time to settle.
      if (!nextFlipped) {
        setTimeout(() => {
          animate(paneOpacity, 1, { duration: WEAPON_FLIP_FADE_MS / 1000 });
        }, WEAPON_FLIP_SETTLE_MS);
      }
    });
  }

  // Skin selection (cycled from the scroll item's shirt toggle, state lives in
  // DashboardBuilds). Index 0 = default look. Falls back to the character's
  // plain icon when there's no cutin art for the selected skin, so there's
  // always something to render/sample a gradient from — build.avatarInfo can
  // be absent entirely (enrichment is best-effort), so every read here is
  // optional-chained rather than assuming the shape is always fully populated.
  const skins = build ? getSkinList(build.avatarInfo) : [];
  const activeSkin = skins[skinIndex % (skins.length || 1)] ?? null;
  const avatarIconSrc = build && (skinIndex > 0 && activeSkin?.sideIcon)
    ? enkaUiUrl(activeSkin.sideIcon)
    : build ? characterIconUrl(build.avatarId) : null;
  const cutinSrc = (activeSkin && enkaUiUrl(activeSkin.cutin)) ?? avatarIconSrc;
  
  // Always the character's own name here, never the build's custom name —
  // unlike BuildScrollItem's strip label, this vertical treatment is meant to
  // read as the character's title card, not whichever build is selected.
  const avatarName = useTranslatedHash(build?.avatarInfo?.AvatarNameHash);
  // Dan Heng's alternate forms translate as "Dan Heng <separator glyph>
  // <Subtitle>" (e.g. "Dan Heng • Imbibitor Lunae") — show just the
  // distinguishing subtitle, not the "Dan Heng" prefix or its separator.
  // Plain "Dan Heng" (no subtitle) has nothing to extract, so it's untouched.
  const danHengSubtitle = avatarName?.match(/Dan Heng[^A-Za-z]*([A-Za-z][A-Za-z\s]*)$/)?.[1]?.trim();
  const nameText = danHengSubtitle || avatarName;
  // Libre Barcode 39 only has glyphs for Latin letters/digits — separators,
  // accents, and any other special characters in the translated name (e.g.
  // "Dan Heng • Imbibitor Lunae") render as missing-glyph boxes instead of
  // barcode stripes, so the barcode specifically (not the main nameText
  // display, which uses a real display font that renders those fine) gets a
  // stripped-down alphanumeric-only copy.
  const barcodeAvatarName = avatarName?.replace(/[^a-zA-Z0-9]/g, '');

  // Long-name overflow handling — see useVerticalNameFit above. Off entirely
  // in scroll mode (nameOverflowScrollMode): the row scrolls at full size
  // instead, so there's nothing to shrink/wrap and no need to measure.
  const nameRowRef = useRef(null);
  const nameMeasureRef = useRef(null);
  const nameFit = useVerticalNameFit(nameRowRef, nameMeasureRef, nameText, !nameOverflowScrollMode);
  // leading-none (line-height:1) tightens the gap BETWEEN the two wrapped
  // columns — line-height is still what controls that spacing in vertical
  // writing mode, it just acts on the horizontal (block) axis here instead
  // of the usual vertical one. Applied whenever wrapped, not just as a
  // wrap-specific extra, since a tighter leading never hurts the
  // single-column case either.
  const nameWrapClass = nameFit.wrap ? 'whitespace-normal break-words leading-none' : 'whitespace-nowrap leading-none';

  // Weapon (light cone) name label on the front glass pane — same shrink-to-fit/
  // wrap treatment as the character name panel above (useVerticalNameFit), just
  // right-anchored (vertical-text-rl, no centring transform) instead of centred,
  // and always fit (no scroll-mode escape hatch — there's no setting for it here).
  const weaponName = useTranslatedHash(build?.equipsWeapon?.weaponNode?.nameHash);
  

  // Gradient samples the avatar ICON, not the cutin splash: cutin art often
  // centres decorative environment effects (Castorice's skin has a golden
  // lantern glow dead-centre) that out-vote the character's own colours even
  // with centre-weighted extraction. The round/side icon crops tight on the
  // character, so its vote reflects their identity colours — same source
  // family the scroll strip samples, which gets these colours right.
  // Overridden avatars skip sampling entirely (null src is the hook's no-op),
  // but the hook itself is still called unconditionally to keep hook order stable.
  const overrideStops = GRADIENT_OVERRIDE_BY_AVATAR[build?.avatarId] ?? null;
  const extractedStops = useCutinGradient(overrideStops ? null : avatarIconSrc);
  const adjust = GRADIENT_ADJUST_BY_AVATAR[build?.avatarId];
  const adjustedStops = (adjust && extractedStops)
    ? extractedStops.map((stop) => {
        let c = tinycolor(stop);
        if (adjust.saturate) c = c.saturate(adjust.saturate);
        if (adjust.darken) c = c.darken(adjust.darken);
        return c.toHexString();
      })
    : extractedStops;
  const gradientStops = overrideStops ?? adjustedStops ?? FALLBACK_GRADIENT_STOPS;
  const gradientCss = `linear-gradient(to right, ${gradientStops.join(', ')})`;
  // STATS/ORNAMENTS base colour, normally the darkest extracted stop, overridden per avatar for some characters.
  const statsBaseColor = WATERMARK_GOLD_BY_AVATAR[build?.avatarId] ?? gradientStops[gradientStops.length - 1];
  const statsGlintColor = tinycolor(statsBaseColor).darken(5).toHexString();
  // SKILLS uses the light end of the gradient instead, since it sits at the dark end of the card.
  const skillsGlintColor = tinycolor(gradientStops[0]).lighten(6).toHexString();
  // "Card accent colour" for the Holiday name layer — the brightest/most vivid
  // stop of this build's own extracted (or overridden) gradient, so the accent
  // always matches this specific character rather than the app-wide theme accent.
  const cardAccentColor = gradientStops[0];

  const cutinTopClass = CUTIN_TOP_BY_AVATAR[build?.avatarId] ?? CUTIN_TOP_DEFAULT;
  const cutinNudgePct = CUTIN_NUDGE_BY_AVATAR[build?.avatarId] ?? 0;

  // Regenerated only when the avatar or the setting actually changes (not on
  // every render, e.g. from rankIconRects/cutinLoaded state updates) —
  // re-rolling positions on every render would read as flicker instead of a
  // fixed starfield. Off by default (buildCardStarfield setting) since 2000
  // clip-path divs is a real render cost some users won't want paying for a
  // decorative effect on one character's card.
  const isStarfieldAvatar = starfieldEnabled && String(build?.avatarId) === String(STARFIELD_AVATAR_ID);
  const starfield = useMemo(
    () => (isStarfieldAvatar ? generateStarfield() : null),
    [isStarfieldAvatar]
  );

  const pathIcon = pathIconUrl(build?.avatarInfo?.AvatarBaseType);
  const elementIcon = elementIconUrl(build?.avatarInfo?.Element);

  // Ranks maps "1".."6" (eidolon number) -> icon path, with only unlocked
  // eidolons present as keys — always render all 6 sockets so the column
  // reads as a fixed set of slots, filling in an icon only where this build
  // actually has that rank.
  const rankIcons = build?.avatarInfo?.Ranks ?? {};
  const rankSlots = Array.from({ length: 6 }, (_, i) => {
    const iconPath = rankIcons[String(i + 1)];
    return iconPath ? enkaUiUrl(iconPath) : null;
  });

  // build.rank doesn't exist yet — hard-coded to 3 for now so the
  // activated-vs-dulled contrast is visible to test against before the real
  // field lands. TODO: change this fallback to 0 once build.rank is actually
  // populated by the backend.
  const activatedRankCount = build?.rank ?? 0;

  // Tracks whether the CURRENT cutinSrc has finished loading, so a character
  // switch shows a spinner instead of the previous character's cutin lingering
  // on screen while the new image fetches/decodes.
  const [cutinLoaded, setCutinLoaded] = useState(false);
  useEffect(() => { setCutinLoaded(false); }, [cutinSrc]);

  useEffect(() => {
    if (build) {
      console.log("BuildDetailCard build:", build);
    }
  }, [build]);

  // Corner notches are cut at cutouts-being-made's own corners but applied to
  // the outer card (see comment above CORNER_NOTCH_RADIUS) — that requires
  // measuring cutouts-being-made's box relative to the card's, since it isn't
  // flush with the card's own edges. getBoundingClientRect is safe here
  // (unlike BuildScrollItem) because nothing in this tree carries a CSS
  // transform/scale that would skew the rects. Depends on `build` so it
  // re-measures once the card actually mounts (refs are null while the
  // "No build selected" placeholder is showing instead).
  useLayoutEffect(() => {
    const cardEl = captureRef.current;
    const cutoutsEl = cutoutsRef.current;
    if (!cardEl || !cutoutsEl) return;

    const measure = () => {
      const cardRect = cardEl.getBoundingClientRect();
      const cutoutsRect = cutoutsEl.getBoundingClientRect();
      if (!cardRect.width || !cardRect.height) return;

      const leftPct = ((cutoutsRect.left - cardRect.left) / cardRect.width) * 100;
      const rightPct = ((cutoutsRect.right - cardRect.left) / cardRect.width) * 100;
      const topPct = ((cutoutsRect.top - cardRect.top) / cardRect.height) * 100;
      const bottomPct = ((cutoutsRect.bottom - cardRect.top) / cardRect.height) * 100;

      setCornerMaskStyle(buildNotchMaskStyle([
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, `${leftPct}% ${topPct}%`),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, `${rightPct}% ${topPct}%`),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, `${leftPct}% ${bottomPct}%`),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, `${rightPct}% ${bottomPct}%`),
      ]));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cardEl);
    observer.observe(cutoutsEl);
    return () => observer.disconnect();
  }, [build]);

  // Rank icons can't just render *inside* their socket div: that div lives
  // inside cutouts-being-made's absolutely-positioned, translated column, and
  // an icon sized to actually fill a socket needs to sit centred on a ring
  // that's straddling that column's own narrow bounds — the same class of
  // "nested too deep inside a transformed wrapper" problem the corner
  // notches and the barcode span both ran into earlier in this file. Instead
  // of nesting the icon there, each socket's own screen centre is measured
  // and used two ways: (1) relative to the outer card, to position the icon
  // overlay rendered as a sibling of the info panel (see the JSX near the
  // end), and (2) relative to cutouts-being-made itself, to punch an actual
  // hole through ITS OWN blur at that exact same tracked point — same
  // "measure once, render/mask at the right level" pattern the corner-notch
  // effect above already uses, just driving two different targets from one
  // set of measurements instead of one.
  useLayoutEffect(() => {
    const cardEl = captureRef.current;
    const cutoutsEl = cutoutsRef.current;
    if (!cardEl || !cutoutsEl) return;

    const measure = () => {
      const cardRect = cardEl.getBoundingClientRect();
      const cutoutsRect = cutoutsEl.getBoundingClientRect();
      if (!cardRect.width || !cardRect.height || !cutoutsRect.width || !cutoutsRect.height) return;

      const ringRects = rankSocketRefs.current.map((el) => el?.getBoundingClientRect() ?? null);

      setRankIconRects(ringRects.map((rect) => rect && {
        leftPct: ((rect.left + rect.width / 2 - cardRect.left) / cardRect.width) * 100,
        topPct: ((rect.top + rect.height / 2 - cardRect.top) / cardRect.height) * 100,
        iconSize: rect.width * RANK_ICON_TO_RING_RATIO,
      }));

      // All rings are the same size, so the first measured one stands in for all.
      const firstRingWidth = ringRects.find(Boolean)?.width;
      if (firstRingWidth) {
        const socketNotchRadius = firstRingWidth * RANK_SOCKET_NOTCH_TO_RING_RATIO;
        setRankSocketNotchMaskStyle(buildNotchMaskStyle([
          radialNotch(`circle ${socketNotchRadius}px`, '50% 0%'),
          radialNotch(`circle ${socketNotchRadius}px`, '50% 100%'),
          radialNotch(`circle ${socketNotchRadius}px`, '0% 50%'),
          radialNotch(`circle ${socketNotchRadius}px`, '100% 50%'),
        ]));
      }

      const ringNotches = ringRects.filter(Boolean).map((rect) => {
        const leftPct = ((rect.left + rect.width / 2 - cutoutsRect.left) / cutoutsRect.width) * 100;
        const topPct = ((rect.top + rect.height / 2 - cutoutsRect.top) / cutoutsRect.height) * 100;
        return radialNotch(`circle ${rect.width * RANK_CUTOUT_TO_RING_RATIO}px`, `${leftPct}% ${topPct}%`);
      });

      setLocalMaskStyle(buildNotchMaskStyle([
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '0% 0%'),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '100% 0%'),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '0% 100%'),
        radialNotch(`circle ${CORNER_NOTCH_RADIUS}px`, '100% 100%'),
        ...ringNotches,
      ]));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cardEl);
    observer.observe(cutoutsEl);
    rankSocketRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [build]);

  // Same fade-in-image treatment as the builds/relics tabs' own load-failure
  // state (loadFail/"Loading Failed.png" in DashboardBuilds.jsx) — a plain
  // motion.img opacity fade, no card chrome of its own.
  if (!build) {
    return (
      <div className='w-full h-full flex items-center justify-center backdrop-blur-md border border-white/20 rounded-2xl bg-black/70 overflow-clip'>
        <motion.img
          src={selectBuildPlaceholder}
          alt='No build selected'
          className='w-full object-contain'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
      </div>
    );
  }

  return (
    // Outer wrapper is a size query container so the card inside can lock to
    // 21:10 while contain-fitting the available space: width is the smaller of
    // the full container width (100cqw) and the width at which a 21:10 box
    // exactly fills the height (100cqh × 2.1 = 210cqh). Reshaping the window
    // then scales the whole card uniformly instead of misaligning the interior.
    <div className='w-full h-full flex items-center justify-center [container-type:size]'>
      {/* id/ref are the future screenshot-download hook point. Deliberately no
          CSS background-image anywhere in this tree (the gradient is the only
          exception, as a plain colour-stop fill) — canvas-capture libraries
          (html2canvas, dom-to-image) frequently drop or blank real image
          background-images, so the cutin below is a plain <img crossOrigin>
          instead, which those libraries rasterize reliably. cornerMaskStyle
          (measured from cutouts-being-made, see the useLayoutEffect above) is
          applied here — not on cutouts-being-made itself — so the 4 vertex
          notches cut through every layer of the card: background, cutin,
          info panel, blur — down to whatever's behind the component. */}
      <div
        ref={captureRef}
        id="build-detail-card"
        className='relative aspect-[21/10] w-[min(100cqw,210cqh)] flex overflow-hidden rounded-3xl ring-1 ring-white/10'
        style={{ background: gradientCss, ...cornerMaskStyle }}
      >
        {/* Negative space left by justifying the info panel to the right
            within its own flex-1 region (see the info-panel wrapper below —
            flex-1 because the name panel now claims a fixed NAME_PANEL_WIDTH_PCT
            slice of the card as an independent sibling, not a share of this
            region) — houses the cutin at an explicit lower z-index than the
            info panel (z-10), so the blur panel can still sample/blur it from
            behind exactly as when it was a bare sibling here, plus the level
            tag. Width is that SAME flex-1 region (100% minus the name panel),
            via inline style rather than inset-0 (100% of the full card) —
            this has to track the info-panel wrapper's own actual width
            exactly, or CUTIN_STRIP_WIDTH_CLASS below computes 20% of the
            wrong base and the cutin drifts off the info panel's real edge
            (see the comment above NAME_PANEL_WIDTH_PCT). */}
        <div className='absolute inset-y-0 left-0 z-0' style={{ width: `calc(100% - ${NAME_PANEL_WIDTH_PCT}%)` }}>
          {/* Starfield — 1510 only (see STARFIELD_AVATAR_ID). Painted first
              inside this wrapper so plain DOM order puts it under the cutin
              box below (both are unpositioned-by-z-index siblings here), while
              still sitting above the outer card's own gradient background. */}
          {starfield && (
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {starfield.map((star, i) => (
                <div
                  key={i}
                  className='absolute'
                  style={{
                    left: star.left,
                    top: star.top,
                    width: star.size,
                    height: star.size,
                    opacity: star.opacity,
                    backgroundColor: star.color,
                    clipPath: star.clipPath,
                    transform: `translate(-50%, -50%) rotate(${star.rotation}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* cutin art, centered on the empty strip the info panel leaves
              uncovered. This wrapper is sized to exactly that strip
              (CUTIN_STRIP_WIDTH_CLASS, same width the level tag box below
              uses), so the cutin box centres on it with plain left-1/2 —
              always exactly centred on the strip's own width, whatever that
              is, rather than a percentage-of-full-card-width figure that has
              to be manually recomputed whenever the split ratio changes.
              aspect-square is applied to that inner box (well-supported), not
              to the <img> directly — aspect-ratio on an absolutely positioned
              *replaced* element (img) turned out not to reliably size from
              h-full in testing, which is what caused the image to render at
              only the width of a narrower wrapper instead of bleeding under
              the info panel for backdrop-blur to pick up. The img itself now
              just fills that pre-sized box with plain w-full h-full. The box
              is wider than this strip by design (aspect-square against the
              full card height) — it overflows evenly past both strip edges,
              same as it did before this was centred via a container instead
              of a raw percentage. */}
          <div className={`absolute inset-y-0 left-0 ${CUTIN_STRIP_WIDTH_CLASS}`}>
            {/* transform is inline (not -translate-x-1/2) so the centring
                -50% and any CUTIN_NUDGE_BY_AVATAR offset combine into one
                value — stacking two Tailwind translate-x classes wouldn't
                add, since both just set the same --tw-translate-x variable
                and the later one wins. cutinNudgePct is 0 for every avatar
                without an entry, so this is translateX(-50%) — identical to
                before — for everyone else. */}
            <div
              className={`absolute h-full aspect-square left-1/2 ${cutinTopClass}`}
              style={{ transform: `translateX(calc(-50% + ${cutinNudgePct}%))` }}
            >
              {/* key={cutinSrc} forces a fresh <img> per character/skin instead of
                  reusing one — reusing it means the browser keeps painting the OLD
                  src's decoded frame until the new one finishes loading, which is
                  exactly the "previous character lingers" bug. With a fresh node,
                  nothing renders until this cutin's own onLoad fires, and the
                  spinner covers that gap. */}
              {cutinSrc && (
                <img
                  key={cutinSrc}
                  src={cutinSrc}
                  alt=""
                  crossOrigin="anonymous"
                  className={`w-full h-full object-cover transition-opacity duration-150 ${cutinLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transform: `scale(${CUTIN_ZOOM})` }}
                  onLoad={() => setCutinLoaded(true)}
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              )}
              {!cutinLoaded && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <CgSpinner className='animate-spin text-white/70' size={28} />
                </div>
              )}
            </div>
          </div>

          {/* Level tag: a small pill using the darkest stop of this build's
              own gradient as its background, centred in the empty strip
              itself (not the whole card, which would land it awkwardly
              under the blur panel). */}
          <div className={`absolute inset-y-0 left-0 ${CUTIN_STRIP_WIDTH_CLASS} flex items-center justify-center [container-type:size]`}>
            {build?.level !== undefined && (
              <>
                {/* Same "duplicate rendered behind, offset toward the
                    top-right, tinted with this build's own darkest gradient
                    stop" treatment as the KR/JP name duplicates below — same
                    offset amount too. Placed first so it paints underneath
                    (same-stacking-level siblings paint in source order). */}
                <span
                  className='league-gothic-bold border-t-2 border-x-2 border-white/0 border-dashed text-[30cqw] leading-none px-3 py-1 w-full rounded-t-md select-none pointer-events-none absolute bottom-0 left-1/2'
                  style={{ color: gradientStops[gradientStops.length - 1], transform: 'translateX(-50%) translate(1.8cqw, -0.3cqh)' }}
                >
                  LV. {build.level}
                </span>
                <span
                  className='league-gothic-bold border-t-2 border-x-2 border-white/0 border-dashed text-white
                   text-[30cqw] leading-none px-3 py-1 w-full rounded-t-md select-none pointer-events-none absolute bottom-0
                    left-1/2 -translate-x-1/2'
                >
                  LV. {build.level}
                </span>
              </>
            )}
          </div>
        </div>

        {/* info panel — flex-1 so it fills whatever's left after the name
            panel's own fixed-width sibling (below) claims its slice, instead
            of spanning the full card the way it used to when the name panel
            lived inside it. */}
        <div className='relative z-10 flex-1 h-full flex justify-end'>
          <div className={`${INFO_PANEL_WIDTH_CLASS} h-full flex [container-type:size]`}>
            <div
              ref={cutoutsRef}
              className='cutouts-being-made relative h-full backdrop-blur-xl border-l-2 border-r-2 border-white/40 border-dashed w-full'
              style={localMaskStyle}
            >
              <div className='absolute bg-amdber-400 bottom-0 right-0 translate-x-1/2 h-[85cqh] px-5 py-3 mb-2 flex flex-col items-center justify-around' >
                {rankSlots.map((_, i) => (
                  <div
                    key={i}
                    ref={(el) => { rankSocketRefs.current[i] = el; }}
                    // Icon size and cutout hole are both a fraction of this ring's own measured width.
                    className='w-[6.2cqh] h-[6.2cqh] shrink-0 rounded-full border-2 border-white/40 border-dashed'
                    style={rankSocketNotchMaskStyle}
                  />
                ))}
              </div>

              <div className=' flex flex-col h-full w-full'>
                <div className='flex w-full h-[50%]'>
                  <div className='relative w-[29%] lightcone-box flex items-center justify-center'
                    style={{ perspective: WEAPON_TILT_PERSPECTIVE_PX }}
                    onMouseMove={handleWeaponPointerMove}
                    onMouseLeave={handleWeaponPointerLeave}
                  >
                    <motion.div
                      className='relative cursor-pointer'
                      style={{ rotateX: weaponRotateX, rotateY: weaponRotateY, scale: 0.93, transformStyle: 'preserve-3d' }}
                      onClick={handleWeaponFlipClick}
                    >
                      {/* scale shrinks the whole lightcone: image, both glass panes, and the flip side. */}
                      {/* back glass pane — offset down-right pre-flip (top-right post-flip),
                          sits behind the art, and slides further along that diagonal as tilt grows */}
                      <motion.div
                        className='absolute inset-0 z-0 bg-gray-800/40
                         backdrop-blur-md border border-[#B2B2B2]/40 flex items-center justify-center'
                        style={{ x: weaponBackX, y: weaponBackY, opacity: paneOpacity, ...WEAPON_CARD_NOTCH_MASK_STYLE }}
                      >
                        <div className='border-2 rounded-md h-[95%] w-[95%] border-[var(--accent-border-60)]'></div>
                      </motion.div>

                      {/* flip pivot: front face is the art, back face is a plain
                          placeholder canvas (no real "back" art exists for a weapon) —
                          same spring as the ambient tilt above so it reads as the same
                          physical object rather than a different animation. The glass
                          panes don't rotate with this (that clipped weirdly against
                          their masks/borders edge-on) — they fade out, snap to their
                          post-flip corner, and fade back in instead; see
                          handleWeaponFlipClick. */}
                      <motion.div
                        className='relative z-10'
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={{ rotateY: isWeaponFlipped ? 180 : 0 }}
                        transition={{ type: 'spring', ...WEAPON_TILT_SPRING }}
                      >
                        <img
                          src={enkaUiUrl(build?.equipsWeapon?.weaponNode?.imagePath)}
                          alt=""
                          className='h-[50cqh]'
                          style={{ backfaceVisibility: 'hidden' }}
                        />
                        {/* back-side canvas — dotted white inset border (Cards Against
                            Humanity-style), name up top with a thin separator under it,
                            then level/rarity/stats below. Rarity is a bare placeholder
                            for now — deliberately unstyled, separate plans for it later. */}
                        <div
                          className='absolute inset-0 bg-gray-700 rounded-md overflow-hidden'
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <div className='absolute inset-[3%] border-2 border-dotted border-white rounded-md flex flex-col items-stretch p-[3cqw]'>
                            <p className={`${weaponBackNameFontClass} text-white text-[2.6cqw] leading-tight text-center shrink-0`}>
                              {weaponName}
                            </p>
                            <div className='w-full h-px bg-white shrink-0 my-[1.5cqw]' />

                            <div className='flex items-start justify-between'>
                              <div className='flex flex-col gap-[0.4cqw]'>
                                <div className='flex items-center gap-[0.8cqw]'>
                                  {/* Dimmed only when the 80 shown here is synthetic (MAX
                                      toggled on a weapon that isn't actually level 80) —
                                      a naturally-80 weapon keeps the normal colour either
                                      way, since that's just the truth, not a toggle effect. */}
                                  <span className={`league-gothic-bold text-[3cqw] leading-none ${isWeaponMaxStats && build?.equipsWeapon?.weaponLevel !== 80 ? 'text-white/40' : 'text-[var(--accent-muted)]'}`}>
                                    Lv. {isWeaponMaxStats ? 80 : (build?.equipsWeapon?.weaponLevel ?? '—')}
                                  </span>
                                  {/* toggles the stat rows below between this equip's
                                      current stats and the weapon's own max (lvl 80 /
                                      superimposition 6) stats — see isWeaponMaxStats
                                      above. Hidden entirely at level 80: current stats
                                      already equal max at the level cap, so there's
                                      nothing the toggle would actually change. */}
                                  {build?.equipsWeapon?.weaponLevel !== 80 && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setIsWeaponMaxStats(v => !v); }}
                                      className={`afacad-bold text-[1.4cqw] leading-none rounded px-[0.6cqw] py-[0.3cqw] transition cursor-pointer select-none
                                        ${isWeaponMaxStats
                                          ? 'bg-[var(--accent-bg-40)] text-white ring-1 ring-[var(--accent-border-60)]'
                                          : 'bg-white/10 text-white/50 hover:text-white/80'}`}
                                    >
                                      MAX
                                    </button>
                                  )}
                                </div>
                                {build?.equipsWeapon?.weaponRefinement != null && (
                                  <span className='afacad-light text-white/40 text-[1.6cqw] leading-none'>
                                    Superimposition {build.equipsWeapon.weaponRefinement}
                                  </span>
                                )}
                              </div>
                              {/* rarity is colour-coded via the same game-native rarity
                                  palette relics use (rarityColors.js) — further styling
                                  (badge/icon/etc.) is planned separately, not today.
                                  +1 because that palette is keyed off relic tids, which
                                  encode rarity as true-star-count + 1 (HSR's own data
                                  convention) — weapons.json's Rarity field has no such
                                  offset, it's the true star count directly, so a real
                                  5★ weapon (rarity "5") needs +1 = "6" to land on the
                                  same amber/gold a 5★ relic gets, not "5"'s purple. */}
                              <span className={`afacad-light text-[1.8cqw] leading-none ${rarityTextColor(build?.equipsWeapon?.rarity != null ? Number(build.equipsWeapon.rarity) + 1 : null) ?? 'text-white/50'}`}>
                                {build?.equipsWeapon?.rarity ? `${build.equipsWeapon.rarity}★` : ''}
                              </span>
                            </div>

                            <div className='flex flex-col gap-[0.8cqw] mt-[2cqw]'>
                              {[
                                ['ATK', build?.equipsWeapon?.baseAtk, build?.equipsWeapon?.weaponNode?.baseAttack, 'text-red-300/80'],
                                ['DEF', build?.equipsWeapon?.baseDefence, build?.equipsWeapon?.weaponNode?.baseDefense, 'text-blue-300/80'],
                                ['HP', build?.equipsWeapon?.baseHP, build?.equipsWeapon?.weaponNode?.baseHP, 'text-green-300/80'],
                              ].map(([label, current, max, colorClass]) => {
                                const displayValue = isWeaponMaxStats ? max : current;
                                // Rounded first, then diffed — matches what's actually on
                                // screen (rounding first then diffing can differ slightly
                                // from diffing raw floats then rounding), so the bracket
                                // always reconciles with the two numbers the user can see.
                                const gain = isWeaponMaxStats && max != null && current != null
                                  ? Math.round(max) - Math.round(current)
                                  : 0;
                                return (
                                  <div key={label} className='flex items-center justify-between border-b border-white/15 pb-[0.5cqw]'>
                                    <span className={`afacad-bold text-[1.6cqw] tracking-wider uppercase leading-none ${colorClass}`}>{label}</span>
                                    <span className='flex items-baseline gap-[0.6cqw]'>
                                      <span className='afacad-semi-bold text-white text-[2cqw] leading-none'>{displayValue != null ? Math.round(displayValue) : '—'}</span>
                                      {gain > 0 && (
                                        <span className='afacad-bold text-emerald-300 text-[1.5cqw] leading-none'>
                                          (+{gain})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* front glass pane — offset up-left pre-flip (bottom-right post-flip),
                          sits in front of the art, and slides further along that diagonal as tilt grows */}
                      <motion.div
                        className='absolute inset-0 z-20 bg-gray-800/40
                          border border-[#B2B2B2]/40 pointer-events-none flex items-center justify-center'
                        style={{ x: weaponFrontOffset, y: weaponFrontOffset, opacity: paneOpacity, ...WEAPON_CARD_NOTCH_MASK_STYLE }}
                      >
                        <div className='relative h-[95%] w-[95%] flex items-center justify-center'>
                          {/* border-only box — the label text is a SIBLING below, not a
                              child of this: mask-image cuts this div's own border AND
                              anything painted inside it, so a label nested in here would
                              get cut by its own cutout too (which is exactly what was
                              happening). Keeping them separate means the notch only ever
                              touches the border. */}
                          <div
                            className='absolute inset-0 border-2 rounded-md border-[var(--accent-border-60)] flex items-center
                             justify-center pointer-events-none'
                            style={WEAPON_CLICK_LABEL_MASK_STYLE}
                          />
                          <p className='absolute bottom-0 left-1/2 translate-y-[30%] -translate-x-1/2 text-[8px] leading-none 
                          whitespace-nowrap text-[var(--accent-border-60)] libre-baskerville-bold'>click</p>

                          {/* weapon name — right-anchored vertical label: text runs
                              top-to-bottom, first column flush against the top-right
                              corner (no padding for now), any overflow wraps into
                              further columns growing leftward from there. Same
                              shrink-to-fit measurement technique as the character name
                              panel (useVerticalNameFit, with its own less-aggressive
                              fit tuning — see WEAPON_NAME_FIT_* above) — a hidden
                              unscaled clone drives the fit, the visible span scales
                              down around its own top-right corner (not centre) so that
                              anchor point never drifts as it shrinks. */}
                          {/* w-full matters here the same way it does on the character
                              name panel (see that div's own comment): both children below
                              are position:absolute, so with no in-flow content this row
                              would shrink-to-fit toward 0 width, and overflow-hidden on a
                              0-width box clips away everything regardless of font/scale —
                              which is exactly why no weapon name was rendering at all. */}
                          

                          {/* A flat bg-fill + box-shadow (the previous approach) always
                              shows a seam no matter how closely the two opacities are
                              matched: the fill is CONSTANT inside the box and the shadow
                              FADES outside it, so there's a kink in the rate of change
                              right at the edge — the eye picks that up as a shape (a
                              Mach-band effect) even when the colour/opacity values line
                              up exactly. A single radial-gradient background sidesteps
                              this entirely: it's one continuous falloff from the text
                              outward to fully transparent, so there's no flat region and
                              no edge to ever perceive. px-6 py-3 gives the gradient room
                              to actually reach "transparent" before hitting the div's own
                              (invisible) bounding box. */}
                          <div
                            className={`rounded-md m-1  px-4 py-3 absolute bottom-1 text-[2.1cqw] text-white ${weaponNameFontClass}`}
                            style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)' }}
                          >
                            {weaponName}
                          </div>

                          {/* weapon level — top-left, INSIDE the border box (this div,
                              not the outer pane) so it actually sits within the visible
                              frame instead of floating in the pane's outer margin.
                              Compact pill: small muted "Lv" label + a bold number, same
                              glass shell (bg + backdrop-blur + thin accent border) the
                              rest of the app's chips use, not a flat block. */}
                          {build?.equipsWeapon?.weaponLevel != null && (
                            <div className='absolute top-1 left-1 flex items-baseline gap-[0.3cqw] bg-gray-900/75 backdrop-blur-md border
                             border-[var(--accent-border-60)] rounded-md px-[0.6cqw] py-[0.2cqw] pointer-events-none select-none'>
                              <span className='afacad-light text-[var(--accent-muted)] text-[1.6cqw] leading-none'>Lv</span>
                              <span className='league-gothic-bold text-white text-[2.1cqw] leading-none'>{build.equipsWeapon.weaponLevel}</span>
                            </div>
                          )}

                          {/* weapon path icon — top-right, same "inside the border box"
                              fix as the level tag above. WeaponNode itself carries no
                              path; this comes from the
                              Store("weapons")-[:CONTAINS_WEAPON]->WeaponNode edge,
                              copied onto this build's own EQUIPS_WEAPON edge
                              server-side (see EquipsWeaponRelationship.path) so it rides
                              along with every existing build-fetch query for free. Same
                              raw AvatarBaseType-style string pathIconUrl already expects
                              for character path icons, so it's reused as-is. */}
                          {pathIconUrl(build?.equipsWeapon?.path) && (
                            <img
                              src={pathIconUrl(build.equipsWeapon.path)}
                              alt=""
                              className='absolute top-1 right-1 w-[3.5cqw] aspect-square object-contain pointer-events-none'
                            />
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                  <div className='relative w-[35%] stats-box flex flex-col p-[1.8cqh]  overflow-y-auto [container-type:size]'>
                    <div className='relative stat-container bg-ambder-400 h-full rounded-md overflow-hidden'>
                      {/* STATS watermark. viewBox maps to the container, textLength fills width, statsTextTransform fills height. */}
                      <svg
                        viewBox='0 0 500 100'
                        preserveAspectRatio='none'
                        className='absolute inset-0 w-full h-full pointer-events-none select-none'
                      >
                        <defs>
                          <linearGradient id={`stats-watermark-glint-${build?.id ?? 'x'}`} x1='0%' y1='0%' x2='100%' y2='15%'>
                            <stop offset='0%' stopColor={statsBaseColor} />
                            <stop offset='35%' stopColor={statsBaseColor} />
                            <stop offset='48%' stopColor={statsGlintColor} />
                            <stop offset='52%' stopColor={statsGlintColor} />
                            <stop offset='65%' stopColor={statsBaseColor} />
                            <stop offset='100%' stopColor={statsBaseColor} />
                          </linearGradient>
                        </defs>
                        <text
                          x='0'
                          y='0'
                          textAnchor='start'
                          textLength='500'
                          lengthAdjust='spacingAndGlyphs'
                          className='badeen-display-font'
                          fontSize={WATERMARK_FONT_SIZE}
                          fill={`url(#stats-watermark-glint-${build?.id ?? 'x'})`}
                          transform={statsTextTransform}
                        >
                          STATS
                        </text>
                      </svg>

                      <div className='relative flex flex-col gap-[0.4cqh] h-full p-[5cqw] justify-center'>
                      {/* Rows are content-sized, centred vertically via justify-center. */}
                      <div className='grid grid-cols-1'>
                        {displayStats.flatMap((stat, i) => {
                          const accent = statRowAccentColor(stat.type);
                          const isDarkStatRowAvatar = DARK_STAT_ROW_AVATARS.has(String(build?.avatarId));
                          const rowTintHex = (accent
                            ? tinycolor(accent).darken(isDarkStatRowAvatar ? 30 : 0)
                            : tinycolor(isDarkStatRowAvatar ? '#000000' : '#ffffff')
                          ).toHexString();
                          const baseAlpha = isDarkStatRowAvatar ? (accent ? 0.3 : 0.25) : (accent ? 0.16 : 0.008);
                          const hoverAlpha = isDarkStatRowAvatar ? (accent ? 0.65 : 0.55) : (accent ? 0.35 : 0.12);
                          const rowBg = tinycolor(rowTintHex).setAlpha(baseAlpha).toRgbString();
                          const rowBgHover = tinycolor(rowTintHex).setAlpha(hoverAlpha).toRgbString();
                          const rowBorder = accent ? tinycolor(accent).setAlpha(0.4).toRgbString() : 'rgba(255,255,255,0.15)';
                          const row = (
                            <div
                              key={stat.type}
                              className='group flex items-center gap-[0.8cqw] min-w-0 rounded-md backdrop-blur-sm px-[1cqw] py-[0.25cqh] transition-colors duration-200 bg-[var(--row-bg)] hover:bg-[var(--row-bg-hover)]'
                              style={{ '--row-bg': rowBg, '--row-bg-hover': rowBgHover, border: `1px solid ${rowBorder}` }}
                            >
                              {/* No truncate, long stat names wrap instead of clipping. */}
                              <span className='flex items-center gap-[1.2cqw] min-w-0'>
                                {stat.type === 'BaseAggro' ? (
                                  // Aggro has no relic icon asset, use a react-icon instead.
                                  <FaRegFaceAngry className='w-[3.2cqh] h-[3.2cqh] text-white/70 shrink-0' />
                                ) : statIconGetter(stat.type) && (
                                  <img
                                    src={statIconGetter(stat.type)}
                                    alt=''
                                    className='w-[3.2cqh] h-[3.2cqh] object-contain shrink-0'
                                  />
                                )}
                                <span
                                  className={`${statLabelFontClass} text-white ${statLabelFontSizeClass} ${statLabelWrapClass} min-w-0`}
                                  style={{ textShadow: `${statLabelShadowOffset} ${statLabelShadowOffset} 0 ${cardAccentColor}` }}
                                >
                                  {stat.label}
                                </span>
                              </span>
                              {/* Hover-only leader line filling the gap between name and value. */}
                              <span className='flex-1 min-w-[1cqw] mx-[0.6cqw] border-b border-dashed border-transparent group-hover:border-white/40 transition-colors duration-200' />
                              <span
                                className={`${statValueFontClass} text-white text-[3.9cqh] tabular-nums shrink-0`}
                                style={{ textShadow: `${statValueShadowOffset} ${statValueShadowOffset} 0 ${cardAccentColor}` }}
                              >
                                {stat.value}
                              </span>
                            </div>
                          );
                          if (i === 0) return [row];
                          return [
                            <div key={`divider-${stat.type}`} className='w-full h-px bg-white/20 my-[0.4cqh]' />,
                            row,
                          ];
                        })}
                      </div>
                      </div>
                    </div>
                  </div>
                  <div className='relative w-[35%] skills-box flex flex-col p-[1.8cqh] overflow-y-auto [container-type:size]'>
                    <div className='relative skills-container bg-ambder-400 h-full rounded-md overflow-hidden'>
                      {/* SKILLS watermark, uses the light end of the gradient since this box sits at the dark end. */}
                      <svg
                        viewBox='0 0 500 100'
                        preserveAspectRatio='none'
                        className='absolute inset-0 w-full h-full pointer-events-none select-none'
                      >
                        <defs>
                          <linearGradient id={`skills-watermark-glint-${build?.id ?? 'x'}`} x1='0%' y1='0%' x2='100%' y2='15%'>
                            <stop offset='0%' stopColor={gradientStops[0]} />
                            <stop offset='35%' stopColor={gradientStops[0]} />
                            <stop offset='48%' stopColor={skillsGlintColor} />
                            <stop offset='52%' stopColor={skillsGlintColor} />
                            <stop offset='65%' stopColor={gradientStops[0]} />
                            <stop offset='100%' stopColor={gradientStops[0]} />
                          </linearGradient>
                        </defs>
                        <text
                          x='0'
                          y='0'
                          textAnchor='start'
                          textLength='500'
                          lengthAdjust='spacingAndGlyphs'
                          className='badeen-display-font'
                          fontSize={WATERMARK_FONT_SIZE}
                          fill={`url(#skills-watermark-glint-${build?.id ?? 'x'})`}
                          transform={skillsTextTransform}
                        >
                          SKILLS
                        </text>
                      </svg>

                    </div>
                  </div>
                </div>
                <div className='w-[99%] h-[50%] flex ornament-box p-[1.8cqh] overflow-y-auto [container-type:size]'>
                  <div className='relative ornaments-container bg-ambder-400 h-full w-full rounded-md overflow-hidden'>
                    {/* ORNAMENTS watermark, same technique as STATS. */}
                    <svg
                      viewBox='0 0 500 100'
                      preserveAspectRatio='none'
                      className='absolute inset-0 w-full h-full pointer-events-none select-none'
                    >
                      <defs>
                        <linearGradient id={`ornaments-watermark-glint-${build?.id ?? 'x'}`} x1='0%' y1='0%' x2='100%' y2='15%'>
                          <stop offset='0%' stopColor={statsBaseColor} />
                          <stop offset='35%' stopColor={statsBaseColor} />
                          <stop offset='48%' stopColor={statsGlintColor} />
                          <stop offset='52%' stopColor={statsGlintColor} />
                          <stop offset='65%' stopColor={statsBaseColor} />
                          <stop offset='100%' stopColor={statsBaseColor} />
                        </linearGradient>
                      </defs>
                      <text
                        x='0'
                        y='0'
                        textAnchor='start'
                        textLength='500'
                        lengthAdjust='spacingAndGlyphs'
                        className='badeen-display-font'
                        fontSize={WATERMARK_FONT_SIZE}
                        fill={`url(#ornaments-watermark-glint-${build?.id ?? 'x'})`}
                        transform={ornamentsTextTransform}
                      >
                        ORNAMENTS
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {!hideBuildIdentity && (
                <div
                  className='absolute top-[0.7%] right-[3%] afacad-light text-[2.1cqh]'
                  style={{ color: tinycolor(cardAccentColor).setAlpha(0.65).toRgbString() }}
                >
                  {focusedUser?.nickname} {focusedUser?.uid}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Name panel — an independent sibling of the info panel (not nested
            inside it, and not flex-grow) so resizing INFO_PANEL_WIDTH_CLASS/
            CUTIN_STRIP_WIDTH_CLASS can never shrink or grow this panel's own
            width; NAME_PANEL_WIDTH_PCT is the only number that controls it —
            applied via inline style rather than a literal Tailwind class
            since the z-0 negative-space layer also needs this exact number
            (as a calc()) to keep its own width in sync (see the comment
            above NAME_PANEL_WIDTH_PCT's declaration).
            shrink-0 backstops the fixed width against flexbox's default
            shrink:1 now that it shares captureRef's own top-level flex row
            with the info panel's flex-1 region. Rendering here (after that
            region, before the rank-icon overlays below) makes it the
            rightmost element, with the info panel sitting as the flex-1
            "centre" between it and the cutin/level-tag negative space.
            Deliberately no h-full: captureRef's own height comes from
            aspect-ratio, not an explicit px/percent value, and height:100% on
            a flex item resolved against that was landing on auto (content-
            based) instead of the card's real height — collapsing the
            flex-col below and clipping the barcode against captureRef's own
            overflow-hidden. Plain flex-item stretch (the container's default
            align-items, unset here) sizes the cross axis directly off the
            flex algorithm instead of a percentage lookup, so it isn't
            exposed to that failure mode — same reason the old nested
            version never needed h-full either. */}
        <div className='relative z-10 shrink-0 flex flex-col [container-type:size] m-2' style={{ width: `${NAME_PANEL_WIDTH_PCT}%` }}>
          {/* path + element icons, side by side. The row's own height
              (12cqh) is only a ceiling now, not the sole driver — each icon
              is sized w-[min(12cqh,40cqw)], so it's capped by whichever axis
              (the name panel's own height or its width) is actually tighter.
              Sizing purely off height (the old h-full + aspect-square, with
              nothing ever checking available width) meant the icons could
              render wider than the row actually had room for whenever the
              name panel's own width:height ratio shifted at all between
              window sizes — since nothing was capping the width side, that
              showed up as inconsistent/overflowing icon sizing depending on
              viewport shape. 40cqw per icon (80cqw for both) deliberately
              leaves generous headroom under 100cqw for this row's gap-3 +
              p-5, which are fixed px and don't scale with the container. */}
          <div className='h-[12cqh] w-full flex items-center justify-center gap-3 bg-ambder-400 p-5 path-and-element
           '>
            {pathIcon && (
              <div className='flex-1 h-full flex items-center justify-center'>
                {/* click carries the raw AvatarBaseType string (e.g. "Warrior"),
                    same value pathIconUrl was already called with above — not
                    the resolved icon URL */}
                <img
                  src={pathIcon} alt=""
                  className='w-[min(12cqh,40cqw)] aspect-square object-contain cursor-pointer'
                  onClick={() => onPathFilterClick?.(build?.avatarInfo?.AvatarBaseType)}
                />
              </div>
            )}
            {elementIcon && (
              <div className='flex-1 h-full flex items-center justify-center'>
                <img
                  src={elementIcon} alt=""
                  className='w-[min(12cqh,40cqw)] aspect-square object-contain cursor-pointer'
                  onClick={() => onElementFilterClick?.(build?.avatarInfo?.Element)}
                />
              </div>
            )}
          </div>

          <div
            ref={nameRowRef}
            className={`flex-grow mt-1 flex items-center justify-center [container-type:size]
          border-t-2 border-dashed border-white/20
           stylised-name bg-amdber-400 ${nameOverflowScrollMode ? 'overflow-y-auto' : 'overflow-hidden'}`}
          >
            {/* layered name treatment: League Gothic is the main/dominant
                layer (always white), Holiday is overlaid directly on top
                of it in this build's own accent colour — same idea as a
                fragrance-label wordmark or a lot of HSR's own character
                title cards (there's no single universally-agreed name for
                "bold font layered over a looser one in the same spot";
                "layered wordmark"/"stacked signature" are the closest
                common descriptions). The back layer is absolutely
                centred via transform so it lines up on the front layer
                regardless of either one's own (very different) rendered
                footprint. Sizes are kept well under 100cqh (the parent's
                own height, since it's a container-type:size context) —
                vertical-text with whitespace-nowrap renders as one tall
                unwrapped column, so font-size drives the run's total
                height, not just glyph size.
                Long-name overflow (nameOverflowScrollMode setting): default
                is shrink-to-fit — useVerticalNameFit (above) measures a
                hidden clone and returns {scale, wrap}, applied to every
                layer below via nameFit/nameWrapClass so they all shrink/wrap
                in lockstep (otherwise the duplicate-offset illusion for
                KR/JP/RU would fall out of sync). The alternate mode drops
                this row's overflow-hidden for overflow-y-auto and renders
                every layer at scale 1/nowrap instead, letting the row
                scroll to the full name rather than shrinking it.
                Barcode removed for now (added back manually later). */}
            {/* w-full here matters: this div is the containing block the
                name span(s) below resolve their absolute left:50% against.
                Without it, a flex item with only out-of-flow (absolute)
                children has no in-flow content to size itself from, so it
                collapses toward 0 width — left:50% of a ~0-width box
                degenerates to a single point, and -translate-x-1/2 (half
                of the *name span's own* width) then anchors the span's
                RIGHT edge there instead of truly centring it, dragging the
                whole column left by its own half-width. That shift is the
                same for every name, but it reads as worse on long/tall
                columns since the eye notices an off-centre vertical
                stripe more easily than a short one. w-full gives left:50%
                a real reference point (the actual centre of stylised-name)
                so -translate-x-1/2 centres correctly regardless of length. */}
            <div className='relative w-full h-full flex items-center justify-center'>

              {/* Hidden, always-unscaled, always-nowrap clone of the main
                  span — purely for useVerticalNameFit's measurement. Not
                  rendered at all in scroll mode, since nothing needs fitting
                  there. See the fit-loop note on useVerticalNameFit itself
                  for why this can't just measure the visible spans instead. */}
              {!nameOverflowScrollMode && (
                <span
                  ref={nameMeasureRef}
                  aria-hidden="true"
                  className={`${localeFontClass ?? 'league-gothic-font'} vertical-text whitespace-nowrap leading-none text-[15cqh] absolute invisible pointer-events-none`}
                >
                  {nameText}
                </span>
              )}

              {!localeFontClass && (
                <span
                  className={`holiday-font vertical-text ${nameWrapClass} ${(nameText?.length ?? 0) > 15 ? 'text-[9cqh]' : 'text-[10cqh]'}`}
                  style={{ color: cardAccentColor, transform: `scale(${nameFit.scale})` }}
                >
                  {nameText}
                </span>
              )}
              {/* Korean, Japanese, and Russian get a second, offset copy of
                  the name rendered behind the main one — same idea as the
                  League Gothic/Holiday layered treatment for Latin
                  locales, but as a duplicate-with-offset instead of a
                  font pairing, tinted with this build's own adaptive
                  accent colour instead of plain white. Placed before the
                  main span in DOM order so it paints underneath
                  (same-stacking-level siblings paint in source order).
                  translate is spelled out by hand here (not the
                  -translate-x/y-1/2 utilities) since it needs to compose
                  the usual -50%/-50% centring with a small extra
                  top-right nudge AND nameFit's scale in the same transform. */}
              {(locale === 'kr' || locale === 'jp' || locale === 'ru') && (
                <span
                  className={`${localeFontClass} vertical-text absolute top-1/2 left-1/2 text-[15cqh] ${nameWrapClass} select-none pointer-events-none`}
                  style={{ color: cardAccentColor, transform: `translate(-50%, -50%) translate(2.8cqw, -0.5cqh) scale(${nameFit.scale})` }}
                >
                  {nameText}
                </span>
              )}
              {/* Centring transform is inline here (not the -translate-x/y-1/2
                  utilities used before) so it can compose with nameFit's
                  scale in one value — stacking a Tailwind transform class
                  with an inline-style transform doesn't add, the inline one
                  simply wins outright (same issue as the cutin box's own
                  nudge transform earlier in this file). */}
              <span
                className={`${localeFontClass ?? 'league-gothic-font'} vertical-text absolute top-1/2 left-1/2 text-[15cqh] text-white ${nameWrapClass} select-none pointer-events-none`}
                style={{ transform: `translate(-50%, -50%) scale(${nameFit.scale})` }}
              >
                {nameText}
              </span>

            </div>
          </div>

          <div
                className='barcode-font mx-auto h-[3cqh] w-[60%] text-[16cqw] whitespace-nowrap text-center overflow-hidden'
                style={{ color: cardAccentColor }}
              >
              {/* Libre Barcode 39 only really has glyphs for Latin
                  letters/digits — locales in NAME_FONT_CLASS_BY_LOCALE
                  (JP/KR/CN/TW/TH/RU) barcode the raw (numeric) name hash
                  instead of the translated name, since none of those
                  scripts render as recognisable barcode stripes. Everywhere
                  else barcodes the translated name, alphanumeric-only (see
                  barcodeAvatarName) so any remaining separators/accents
                  don't render as missing-glyph boxes either. */}
              {localeFontClass ? build?.avatarInfo?.AvatarNameHash : barcodeAvatarName}
          </div>

        </div>

        {/* Rank icons render here, as siblings of the info panel, rather than
            inside their socket divs — see the rankIconRects useLayoutEffect
            above for why. Positioned from each socket's own measured centre.
            Ranks at or below activatedRankCount get full colour, plus a
            shimmer sweep (.rank-icon-shimmer, defined in index.css) when the
            user's rankIconShimmer setting is on (defaults off); ranks above
            it are desaturated/dimmed via filter to read as locked. */}
        {rankSlots.map((iconSrc, i) => {
          const rect = rankIconRects[i];
          if (!iconSrc || !rect) return null;
          const isActivated = (i + 1) <= activatedRankCount;
          return (
            <div
              key={i}
              className='absolute rounded-full overflow-hidden pointer-events-none'
              style={{
                left: `${rect.leftPct}%`,
                top: `${rect.topPct}%`,
                width: rect.iconSize,
                height: rect.iconSize,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <img
                src={iconSrc}
                alt=""
                className='w-full h-full object-cover'
                style={isActivated ? undefined : { filter: 'grayscale(1) brightness(0.55)', opacity: 0.55 }}
              />
              {isActivated && rankIconShimmerEnabled && <div className='rank-icon-shimmer absolute inset-0' />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BuildDetailCard;

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LuUsersRound } from 'react-icons/lu';
import { CgSpinner } from 'react-icons/cg';
import tinycolor from 'tinycolor2';
import { characterIconUrl, enkaUiUrl, getSkinList, pathIconUrl, elementIconUrl } from './buildConstants';
import useCutinGradient from './useCutinGradient';
import { useTranslatedHash } from '../../../../../utils/hashTranslation';
import { selectRankIconShimmer, selectHideBuildIdentity, selectBuildCardStarfield } from '../../../../../store/settingsSlice';
import { selectLoc } from '../../../../../store/localisationSlice';

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
// the 85%-wide info panel, flush to that panel's left edge), so its corners
// don't sit at a fixed 0%/100% of the outer card — their position has to be
// measured relative to the card, not assumed.
const CORNER_NOTCH_RADIUS = 10; // px

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

// Small bites at the 4 cardinal points of each rank-eidolon socket ring,
// giving its dashed border the same "interrupted, flowing around a cutout"
// look as the rest of the card instead of a plain unbroken circle. The ring
// itself is a fixed w-11/h-11 (44px) box now — it used to size itself purely
// from padding with no explicit width/height, which left it vulnerable to
// the flex column's default align-items:stretch distorting it into an
// ellipse instead of a circle; an explicit square size sidesteps that.
const RANK_SOCKET_NOTCH_RADIUS = 7; // px
const RANK_SOCKET_NOTCH_MASK_STYLE = buildNotchMaskStyle([
  radialNotch(`circle ${RANK_SOCKET_NOTCH_RADIUS}px`, '50% 0%'),
  radialNotch(`circle ${RANK_SOCKET_NOTCH_RADIUS}px`, '50% 100%'),
  radialNotch(`circle ${RANK_SOCKET_NOTCH_RADIUS}px`, '0% 50%'),
  radialNotch(`circle ${RANK_SOCKET_NOTCH_RADIUS}px`, '100% 50%'),
]);
const RANK_ICON_SIZE = 32; // px — sized to sit inside the 44px ring (minus its border-2) with a small margin
const RANK_CUTOUT_RADIUS = 20; // px — the actual hole punched through cutouts-being-made's blur, tracked to each ring's measured centre

// Neutral placeholder while the cutin's gradient is still being sampled (or
// there's no cutin to sample at all) — same 4-stop shape as the real thing,
// just desaturated, so there's no flash-of-different-layout on load.
const FALLBACK_GRADIENT_STOPS = ['#3f3f46', '#27272a', '#18181b', '#09090b'];

// Cutins whose art places the character off-centre in the frame — nudge the
// splash so the character actually lands on the visible strip (higher % =
// further right, default 7.5% = centre of the uncovered strip).
// Full literal Tailwind classes (not interpolated values): the scanner only
// generates CSS for class names it can find verbatim in the source.
const CUTIN_LEFT_DEFAULT = 'left-[7.5%]';
const CUTIN_LEFT_BY_AVATAR = {
  1106: 'left-[12.5%]',
  1205: 'left-[8%]',
  1208: 'left-[9.5%]',
  1225: 'left-[11%]',
  1301: 'left-[4%]',
  1313: 'left-[8%]',
  1403: 'left-[11%]',
  1406: 'left-[6%]',
  1407: 'left-[11.5%]',
  1408: 'left-[9.5%]',
  1409: 'left-[3%]',
  1414: 'left-[9%]',
  1501: 'left-[8.5%]',
  1502: 'left-[11.5%]',
  1510: 'left-[11%]',
};

// Same idea, vertical axis — a handful of cutins sit slightly high/low in
// their own frame regardless of horizontal centring.
const CUTIN_TOP_DEFAULT = 'top-0';
const CUTIN_TOP_BY_AVATAR = {
  1506: 'top-[4%]',
};

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

// Post-extraction tone adjustments for characters whose extracted HUE is right
// but the tone is off — full overrides above are for when the hue itself is
// wrong. Applied per stop to the sampled gradient.
const GRADIENT_ADJUST_BY_AVATAR = {
  1412: { saturate: 16, darken: 18 }, // deeper and darker (bumped twice now)
  1506: { saturate: 6, darken: 22 },  // considerably darken, then deepened further
};

// League Gothic/Holiday are Latin display faces with no glyphs for these
// scripts, so locales that need them get a single substitute layer instead
// of the two-layer Latin treatment (see the name JSX below) — a different
// face per locale rather than one shared font, since JP/KR/CN-TW/TH don't
// share a script and no single face covers all of them well. This same map
// also decides which locales fall back to barcoding the raw name hash
// instead of the translated name (see the barcode JSX further down) — none
// of these scripts render as recognisable barcode stripes in Libre Barcode 39.
const NAME_FONT_CLASS_BY_LOCALE = {
  jp: 'dotgothic16-font',
  kr: 'gasoek-one-font',
  cn: 'liu-jian-mao-cao-font',
  tw: 'liu-jian-mao-cao-font',
  th: 'pattaya-font',
};

function BuildDetailCard({ build, skinIndex = 0 }) {
  const rankIconShimmerEnabled = useSelector(selectRankIconShimmer);
  const hideBuildIdentity = useSelector(selectHideBuildIdentity);
  const starfieldEnabled = useSelector(selectBuildCardStarfield);
  const locale = useSelector(selectLoc);
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
  // cutouts-being-made's own mask: the 4 static corner notches plus a hole
  // tracked to each ring's measured centre (see the rankSocketRefs
  // useLayoutEffect further down). Defaults to just the corners so they
  // still show before the first measurement pass.
  const [localMaskStyle, setLocalMaskStyle] = useState(LOCAL_CORNER_MASK_STYLE);

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
  // "Card accent colour" for the Holiday name layer — the brightest/most vivid
  // stop of this build's own extracted (or overridden) gradient, so the accent
  // always matches this specific character rather than the app-wide theme accent.
  const cardAccentColor = gradientStops[0];

  const cutinLeftClass = CUTIN_LEFT_BY_AVATAR[build?.avatarId] ?? CUTIN_LEFT_DEFAULT;
  const cutinTopClass = CUTIN_TOP_BY_AVATAR[build?.avatarId] ?? CUTIN_TOP_DEFAULT;

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
      }));

      const ringNotches = ringRects.filter(Boolean).map((rect) => {
        const leftPct = ((rect.left + rect.width / 2 - cutoutsRect.left) / cutoutsRect.width) * 100;
        const topPct = ((rect.top + rect.height / 2 - cutoutsRect.top) / cutoutsRect.height) * 100;
        return radialNotch(`circle ${RANK_CUTOUT_RADIUS}px`, `${leftPct}% ${topPct}%`);
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

  if (!build) {
    return (
      <div className='w-full h-full flex flex-col items-center justify-center gap-2'>
        <LuUsersRound size={32} />
        No build selected.
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
            (its own box spans the full card, but its visible w-[85%]
            content below is pushed to that side) — houses the cutin at an
            explicit lower z-index than the info panel (z-10), so the blur
            panel can still sample/blur it from behind exactly as when it
            was a bare sibling here, plus the level tag. */}
        <div className='absolute inset-0 z-0'>
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
              uncovered. Empty strip = leftmost 15% (100% - the info panel's
              w-[85%] below), so its centre sits at 7.5% of the card width;
              left-[7.5%] -translate-x-1/2 puts this box's own centre there
              (a few % further right for RIGHT_SHIFTED_AVATARS, whose art draws
              the character left-of-centre). aspect-square is applied to this
              plain div (well-supported), not to the <img> directly —
              aspect-ratio on an absolutely positioned *replaced* element (img)
              turned out not to reliably size from h-full in testing, which is
              what caused the image to render at only the width of a narrower
              wrapper instead of bleeding under the info panel for
              backdrop-blur to pick up. The img itself now just fills this
              pre-sized box with plain w-full h-full. */}
          <div className={`absolute h-full aspect-square -translate-x-1/2 ${cutinLeftClass} ${cutinTopClass}`}>
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

          {/* Level tag: a small pill using the darkest stop of this build's
              own gradient as its background, centred in the empty strip
              itself (not the whole card, which would land it awkwardly
              under the blur panel). */}
          <div className='absolute inset-y-0 left-0 w-[15%] flex items-center justify-center [container-type:size]'>
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
                  Lv. {build.level}
                </span>
                <span
                  className='league-gothic-bold border-t-2 border-x-2 border-white/0 border-dashed text-white
                   text-[30cqw] leading-none px-3 py-1 w-full rounded-t-md select-none pointer-events-none absolute bottom-0
                    left-1/2 -translate-x-1/2'
                >
                  Lv. {build.level}
                </span>
              </>
            )}
          </div>
        </div>

        {/* info panel */}
        <div className='relative z-10 w-full h-full flex justify-end'>
          <div className='w-[85%] h-full flex [container-type:size]'>
            <div
              ref={cutoutsRef}
              className='cutouts-being-made relative h-full backdrop-blur-xl border-l-2 border-r-2 border-white/10 border-dashed w-[87%] '
              style={localMaskStyle}
            >
              <div className='absolute bg-amdber-400 bottom-0 right-0 translate-x-1/2 h-[85cqh] px-5 py-3 mb-2 flex flex-col items-center justify-around' >
                {rankSlots.map((_, i) => (
                  <div
                    key={i}
                    ref={(el) => { rankSocketRefs.current[i] = el; }}
                    className='w-11 h-11 shrink-0 rounded-full border-2 border-white/15 border-dashed'
                    style={RANK_SOCKET_NOTCH_MASK_STYLE}
                  />
                ))}
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

            <div className='m-2 flex-grow flex flex-col [container-type:size]'>
              {/* path + element icons, side by side, evenly split and each
                  filling the row's full height (aspect-square keeps them from
                  distorting if the row itself ever isn't square-icon-shaped). */}
              <div className='h-[12cqh] w-full flex items-center justify-center gap-3 bg-ambder-400 p-5 path-and-element
               '>
                {pathIcon && (
                  <div className='flex-1 h-full flex items-center justify-center'>
                    <img src={pathIcon} alt="" className='h-full aspect-square object-contain' />
                  </div>
                )}
                {elementIcon && (
                  <div className='flex-1 h-full flex items-center justify-center'>
                    <img src={elementIcon} alt="" className='h-full aspect-square object-contain' />
                  </div>
                )}
              </div>

              <div className='flex-grow mt-1 flex items-center justify-center overflow-hidden [container-type:size]
              border-t-2 border-dashed border-white/20
               stylised-name bg-amdber-400'>
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
                    height, not just glyph size; overflow-hidden on the parent
                    is a hard backstop so long names clip cleanly instead of
                    bleeding into the row above.
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

                  {!localeFontClass && (
                    <span
                      className={`holiday-font vertical-text whitespace-nowrap ${(nameText?.length ?? 0) > 15 ? 'text-[9cqh]' : 'text-[10cqh]'}`}
                      style={{ color: cardAccentColor }}
                    >
                      {nameText}
                    </span>
                  )}
                  {/* Korean and Japanese get a second, offset copy of the
                      name rendered behind the main one — same idea as the
                      League Gothic/Holiday layered treatment for Latin
                      locales, but as a duplicate-with-offset instead of a
                      font pairing, tinted with this build's own adaptive
                      accent colour instead of plain white. Placed before the
                      main span in DOM order so it paints underneath
                      (same-stacking-level siblings paint in source order).
                      translate is spelled out by hand here (not the
                      -translate-x/y-1/2 utilities) since it needs to compose
                      the usual -50%/-50% centring with a small extra
                      top-right nudge in the same transform. */}
                  {(locale === 'kr' || locale === 'jp') && (
                    <span
                      className={`${localeFontClass} vertical-text absolute top-1/2 left-1/2 text-[15cqh] whitespace-nowrap select-none pointer-events-none`}
                      style={{ color: cardAccentColor, transform: 'translate(-50%, -50%) translate(2.8cqw, -0.5cqh)' }}
                    >
                      {nameText}
                    </span>
                  )}
                  <span className={`${localeFontClass ?? 'league-gothic-font'} vertical-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15cqh] text-white whitespace-nowrap select-none pointer-events-none`}>
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
                      (JP/KR/CN/TW/TH) barcode the raw (numeric) name hash
                      instead of the translated name, since none of those
                      scripts render as recognisable barcode stripes.
                      Everywhere else barcodes fine, translated name included. */}
                  {localeFontClass ? build?.avatarInfo?.AvatarNameHash : avatarName}
              </div>

            </div>
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
                width: RANK_ICON_SIZE,
                height: RANK_ICON_SIZE,
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

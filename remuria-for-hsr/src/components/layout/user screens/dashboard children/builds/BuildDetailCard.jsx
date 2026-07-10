import { useEffect, useRef, useState } from 'react';
import { LuUsersRound } from 'react-icons/lu';
import { CgSpinner } from 'react-icons/cg';
import tinycolor from 'tinycolor2';
import { characterIconUrl, enkaUiUrl, getSkinList } from './buildConstants';
import useCutinGradient from './useCutinGradient';

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
};

// Same idea, vertical axis — a handful of cutins sit slightly high/low in
// their own frame regardless of horizontal centring.
const CUTIN_TOP_DEFAULT = 'top-0';
const CUTIN_TOP_BY_AVATAR = {
  1506: 'top-[4%]',
};

// Hand-picked gradients (4 stops, left -> right) for characters whose palette
// the extractor can't get right by construction. Phainon (1408) is
// near-monochrome white/gray: the vibrancy vote deliberately filters out all
// neutrals (they carry no hue), so the only pixels left voting are his warm
// skin shading — and the saturation floor in useCutinGradient then amplified
// that into reddish orange. No weighting tweak fixes "the character's
// identity colour IS a neutral", so these skip extraction entirely.
const GRADIENT_OVERRIDE_BY_AVATAR = {
  1220: ['#2fb8a8', '#1f8d84', '#12615e', '#073634'], // turquoise green-blue
  1301: ['#6b1f2a', '#4a141d', '#2a0a10', '#080304'], // deep wine red -> black
  1408: ['#94a3b8', '#475569', '#1e293b', '#020617'], // cool gray -> black
  1414: ['#14746b', '#0d4e47', '#082e2a', '#020806'], // deep jade-teal -> black (robe/sash, not the gold backdrop motif)
  1415: ['#16245c', '#3f2b7d', '#83377f', '#c25585'], // deep blue -> pink
};

// Post-extraction tone adjustments for characters whose extracted HUE is right
// but the tone is off — full overrides above are for when the hue itself is
// wrong. Applied per stop to the sampled gradient.
const GRADIENT_ADJUST_BY_AVATAR = {
  1412: { saturate: 16, darken: 18 }, // deeper and darker (bumped twice now)
  1506: { saturate: 6, darken: 22 },  // considerably darken, then deepened further
};

function BuildDetailCard({ build, skinIndex = 0 }) {
  const captureRef = useRef(null);

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

  const cutinLeftClass = CUTIN_LEFT_BY_AVATAR[build?.avatarId] ?? CUTIN_LEFT_DEFAULT;
  const cutinTopClass = CUTIN_TOP_BY_AVATAR[build?.avatarId] ?? CUTIN_TOP_DEFAULT;

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
          instead, which those libraries rasterize reliably. */}
      <div
        ref={captureRef}
        id="build-detail-card"
        className='relative aspect-[21/10] w-[min(100cqw,210cqh)] flex overflow-hidden rounded-3xl ring-1 ring-white/10'
        style={{ background: gradientCss }}
      >
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

        {/* info panel — intentionally left empty, filled in separately. */}
        <div className='relative z-10 w-full h-full flex justify-end'>
          <div className='w-[85%] h-full backdrop-blur-xl border-l rounded-l-xl border-white/15' />
        </div>
      </div>
    </div>
  );
}

export default BuildDetailCard;

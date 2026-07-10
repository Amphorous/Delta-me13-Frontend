import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useTransform } from 'framer-motion';
import { MdAdd, MdEdit } from 'react-icons/md';
import { IoShirtOutline } from 'react-icons/io5';
import { FaStar } from 'react-icons/fa';
import { characterIconUrl, displayBuildName, enkaUiUrl, getSkinList, pathIconUrl, elementIconUrl } from './buildConstants';
import { getThemeBgColor } from '../../../../../utils/themeColors';
import { useTranslatedHash } from '../../../../../utils/hashTranslation';
import useAvatarPatternBg from './useAvatarPatternBg';

// The left window border is a chord of an imaginary circle of radius ARC_RADIUS; each
// item's right edge sits on that circle's arc. At screen-center (d=0) the arc is
// ARC_BULGE px away from the chord (max protrusion, i.e. the focused item); at
// |d| >= ARC_RADIUS the arc meets the chord again (items sit flush against the border).
// A circle's curvature at its own peak is 1/R, so R has to be kept close to itemHeight
// or the arc is nearly flat near the center — a much larger radius (e.g. several times
// itemHeight) makes the immediate neighbor barely distinguishable from the focused item.
const ARC_RADIUS = 170;
const ARC_BULGE = 55;
// Constant breathing room between the strip's left border and every item's left
// edge. Applied as `left` (outside the scale transform), so it doesn't shrink
// with the item the way inner padding would.
const LEFT_GAP = 12;
// Even visual spacing: items occupy fixed itemHeight-tall slots but render at
// scale(d), so uncompensated gaps grow the further an item sits from center.
// Each item pulls itself toward the center by the total height lost to
// shrinking between itself and the center. Naively that's a chained sum of
// h·(1-s)/2 per adjacent pair, but scale is a pure function of distance, so
// the chain telescopes into a closed-form integral of (1 - scale(u)) that each
// item evaluates independently — minus ITEM_GAP per slot, which yields a
// constant ITEM_GAP visual gap between every settled adjacent pair.
const SCALE_RATE = 0.08; // scale lost per itemHeight of distance from center
const SCALE_MIN = 0.6;
const ITEM_GAP = 4; // px — desired visual gap between adjacent items
const NOTCH_RADIUS = 5; // px — ticket-stub notch where the divider meets the card edge

// Build CV badge — same tier colours as the relic CV badge in RelicItem, but a
// build's CV sums across ~6 relics, so the relic thresholds (40/30/20/15) are ×6.
function buildCvBadgeBg(cv) {
  if (cv >= 240) return 'bg-red-950/95';
  if (cv >= 180) return 'bg-cyan-950/95';
  if (cv >= 120) return 'bg-amber-950/95';
  if (cv >= 90) return 'bg-purple-950/95';
  return 'bg-blue-950/95';
}

function buildCvBadgeText(cv) {
  if (cv >= 240) return 'text-red-300';
  if (cv >= 180) return 'text-cyan-300';
  if (cv >= 120) return 'text-amber-300';
  if (cv >= 90) return 'text-purple-300';
  return 'text-blue-300';
}

// True when the given ISO datetime falls on today's calendar date.
function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// Character rarity pill — same dark-bg/light-text badge language as the CV
// badge and NEW tag in this file, just keyed by star tier instead: 5* gold,
// 4* purple, 3* blue, anything else gray.
function rarityPillBg(rarity) {
  if (rarity >= 5) return 'bg-amber-900/90 border border-amber-500/40';
  if (rarity === 4) return 'bg-purple-900/90 border border-purple-500/40';
  if (rarity === 3) return 'bg-blue-900/90 border border-blue-500/40';
  return 'bg-gray-700/90 border border-gray-400/40';
}

function rarityPillText(rarity) {
  if (rarity >= 5) return 'text-amber-300';
  if (rarity === 4) return 'text-purple-300';
  if (rarity === 3) return 'text-blue-300';
  return 'text-gray-300';
}

// "2 July, 2026" — with the minute-precision time appended while hovered.
function formatBuildDate(iso, withTime) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const date = `${d.getDate()} ${d.toLocaleString('en', { month: 'long' })}, ${d.getFullYear()}`;
  return withTime ? `${date} · ${d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}` : date;
}

// Detects whether `ref`'s element is being truncated at its current (single-line)
// width. Callers render single-line first (so this can measure against the
// un-clamped natural size), then switch to a smaller two-line clamp once true —
// at which point line-clamp's own native ellipsis takes over if even two lines
// isn't enough, so there's nothing further to measure.
function useTextOverflow(ref, text) {
  const [overflowing, setOverflowing] = useState(false);

  // Reset on text change so a shorter replacement gets a fresh single-line
  // measurement instead of staying stuck in the previous text's clamped state.
  useLayoutEffect(() => setOverflowing(false), [text]);

  useLayoutEffect(() => {
    if (overflowing) return;
    const el = ref.current;
    if (!el) return;
    function check() {
      if (el.scrollWidth > el.clientWidth + 1) setOverflowing(true);
    }
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [overflowing, text]);

  return overflowing;
}

function BuildScrollItem({ build, index, itemHeight, y, isFocused, onSelect, onCharacterFilterClick, skinIndex = 0, onCycleSkin }) {
  const d = useTransform(y, (v) => index * itemHeight + v); // px distance from viewport center
  const x = useTransform(d, (dist) => {
    const clamped = Math.min(Math.abs(dist), ARC_RADIUS);
    return Math.max(Math.sqrt(ARC_RADIUS * ARC_RADIUS - clamped * clamped) - (ARC_RADIUS - ARC_BULGE), 0);
  });
  const scale = useTransform(d, (dist) => Math.max(1 - (Math.abs(dist) / itemHeight) * SCALE_RATE, SCALE_MIN));
  const opacity = useTransform(d, (dist) => Math.max(1 - (Math.abs(dist) / itemHeight) * 0.16, 0.3));
  const zIndex = useTransform(d, (dist) => Math.round(100 - Math.min(Math.abs(dist) / itemHeight, 50)));
  // Gap compensation (see SCALE_RATE comment): ∫₀ᴰ (1 - scale(u)) du, piecewise
  // because scale bottoms out at SCALE_MIN beyond distance Dc.
  const yComp = useTransform(d, (dist) => {
    const D = Math.abs(dist);
    const Dc = (itemHeight * (1 - SCALE_MIN)) / SCALE_RATE;
    const lost = D <= Dc
      ? (SCALE_RATE / (2 * itemHeight)) * D * D
      : (SCALE_RATE / (2 * itemHeight)) * Dc * Dc + (1 - SCALE_MIN) * (D - Dc);
    const comp = lost - (ITEM_GAP * D) / itemHeight;
    return dist > 0 ? -comp : comp;
  });

  const buildLabel = displayBuildName(build.buildName) ?? (build.isStatic ? 'Current' : 'Build');
  const patternBg = useAvatarPatternBg(build.avatarId);
  const avatarName = useTranslatedHash(build.avatarInfo?.AvatarNameHash);
  const nameText = (buildLabel !== 'Current') ? buildLabel : avatarName;
  const nameRef = useRef(null);
  const nameWrapped = useTextOverflow(nameRef, nameText);

  const cv = build.cv ?? 0;
  const cvBadgeRef = useRef(null);
  const iconColRef = useRef(null);
  const cardRef = useRef(null);
  const dividerRef = useRef(null);
  const pathIcon = pathIconUrl(build.avatarInfo?.AvatarBaseType);
  const elementIcon = elementIconUrl(build.avatarInfo?.Element);
  const rarity = build.avatarInfo?.Rarity ?? 0;
  const [showCVTooltip, setShowCVTooltip] = useState(false);
  const [cvTooltipPos, setCVTooltipPos] = useState({ top: 0, left: 0 });
  const [dateHovered, setDateHovered] = useState(false);

  // Ticket-stub notches punched out of the card's top AND bottom edges where the
  // divider meets them (all builds, named or Current) — same look as
  // UserLongCard's useCutouts, but computed from offsetLeft (layout space)
  // instead of getBoundingClientRect: the mask applies in pre-transform
  // coordinates, and this item carries an animated scale that would skew
  // rect-based measurements.
  const [notchStyle, setNotchStyle] = useState(undefined);
  useLayoutEffect(() => {
    function update() {
      const divider = dividerRef.current;
      if (!cardRef.current || !divider) return;
      const cx = divider.offsetLeft + divider.offsetWidth / 2;
      const layers = [
        `radial-gradient(circle ${NOTCH_RADIUS}px at ${cx}px 0, transparent 99%, #000 100%)`,
        `radial-gradient(circle ${NOTCH_RADIUS}px at ${cx}px 100%, transparent 99%, #000 100%)`,
      ];
      // Mirrors CutoutUtil's compositing: layers intersect downward, bottom-most
      // composites onto the empty canvas so it must be add/source-over.
      const composites = layers.map(() => 'intersect');
      const webkitComposites = layers.map(() => 'source-in');
      composites[composites.length - 1] = 'add';
      webkitComposites[webkitComposites.length - 1] = 'source-over';
      setNotchStyle({
        WebkitMaskImage: layers.join(', '),
        maskImage: layers.join(', '),
        WebkitMaskComposite: webkitComposites.join(', '),
        maskComposite: composites.join(', '),
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      });
    }
    update();
    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    if (dividerRef.current) ro.observe(dividerRef.current);
    if (iconColRef.current) ro.observe(iconColRef.current); // icon column resize shifts the divider
    return () => ro.disconnect();
  }, []);

  function handleCVHover(show) {
    if (show && cvBadgeRef.current) {
      const rect = cvBadgeRef.current.getBoundingClientRect();
      setCVTooltipPos({ top: rect.bottom + 5, left: rect.left + rect.width / 2 });
    }
    setShowCVTooltip(show);
  }

  // updateDate (last name submission) takes precedence over creationDate present.
  const isUpdatedDate = !!build.updateDate;
  const dateText = formatBuildDate(build.updateDate ?? build.creationDate, dateHovered);
  const isNew = isToday(build.creationDate) || isToday(build.updateDate);

  // Skin cycling: index 0 = default look (keeps the existing bust art from
  // characterIconUrl); alternate skins render their own side-icon asset, the
  // only per-skin icon the backend provides.
  const skins = getSkinList(build.avatarInfo);
  const activeSkin = skins[skinIndex % (skins.length || 1)] ?? null;
  const iconSrc = (skinIndex > 0 && activeSkin?.sideIcon)
    ? enkaUiUrl(activeSkin.sideIcon)
    : characterIconUrl(build.avatarId);

  const skinLabel = skinIndex === 0 ? 'Default' : `Skin ${skinIndex + 1}/${skins.length}`;

  const skinBtnRef = useRef(null);
  const [showSkinTooltip, setShowSkinTooltip] = useState(false);
  const [skinTooltipPos, setSkinTooltipPos] = useState({ top: 0, left: 0 });
  // After a click, the tooltip flashes the new skin's label ("Default" / "Skin
  // 2/3") for a beat instead of the static "toggle skin" hint — skinLabel reads
  // the current skinIndex prop, so once the parent's cycled state re-renders
  // this in, the flash always shows the skin actually landed on.
  const [justCycled, setJustCycled] = useState(false);
  const skinFlashTimeout = useRef(null);
  useEffect(() => () => { if (skinFlashTimeout.current) clearTimeout(skinFlashTimeout.current); }, []);

  function positionSkinTooltip() {
    if (!skinBtnRef.current) return;
    const rect = skinBtnRef.current.getBoundingClientRect();
    setSkinTooltipPos({ top: rect.bottom + 5, left: rect.left + rect.width / 2 });
  }

  function handleSkinHover(show) {
    if (show) positionSkinTooltip();
    // Don't cut the post-click flash short if the pointer happens to leave —
    // its own timeout below is what closes it.
    if (show || !justCycled) setShowSkinTooltip(show);
  }

  function handleSkinClick(e) {
    e.stopPropagation();
    onCycleSkin?.(build.avatarId, skins.length);
    positionSkinTooltip();
    setJustCycled(true);
    setShowSkinTooltip(true);
    if (skinFlashTimeout.current) clearTimeout(skinFlashTimeout.current);
    skinFlashTimeout.current = setTimeout(() => {
      setJustCycled(false);
      setShowSkinTooltip(false);
    }, 1200);
  }

  return (
    <motion.div
      className="absolute px-2 cursor-pointer select-none"
      // Width reserves ARC_BULGE px on the right (arc shift headroom) plus LEFT_GAP
      // (the left inset) so the focused item's rightward arc shift never pushes its
      // box past the strip's own container edge into whatever sits beside it.
      // transformOrigin pins scaling to the left edge: with the default center
      // origin, a shrinking item's left edge drifted right by (1-scale)*width/2,
      // pulling far items away from the strip's left border.
      style={{ top: index * itemHeight - itemHeight / 2, left: LEFT_GAP, height: itemHeight, width: `calc(100% - ${ARC_BULGE + LEFT_GAP}px)`, x, y: yComp, scale, opacity, zIndex, transformOrigin: 'left center' }}
      onClick={onSelect}
    >
      <div ref={cardRef} className={`relative h-full w-full flex items-center jdustify-center gap-1 bg-gdray-950/75 backdrop-blur-md
      overflow-hidden rounded-md }`}
        style={{ ...(patternBg ?? { backgroundColor: getThemeBgColor({ darkness: 50, alpha: 90 }) }), ...(notchStyle ?? {}) }}
      >
        {/* dotted inset frame — UserLongCard identity; the avatar (relative,
            later in DOM) paints above it */}
        <div className="absolute inset-1 border-2 border-dashed border-white/15 rounded-md pointer-events-none" />
        <img
          src={iconSrc}
          alt=""
          className="relative -ml-3 h-[130%] object-cover shrink-0"
          onClick={(e) => { e.stopPropagation(); onCharacterFilterClick?.(build.avatarId); }}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          onLoad={(e) => { e.currentTarget.style.visibility = 'visible'; }}
        />
        <div className="flex flex-col justify-center w-full h-full [container-type:size]">
          <div className='flex items-center gap-[2cqw] px-2 min-w-0'>
            {/* Single-line by default; useTextOverflow measures against that and
                flips to a smaller two-line clamp only when it's actually being
                truncated, so short names keep the full-size single line. Native
                line-clamp ellipsizes on its own if even two lines isn't enough —
                nothing further to detect there. */}
            <div
              ref={nameRef}
              className={`libre-baskerville-bold text-white ${nameWrapped ? 'text-[7cqw] leading-tight line-clamp-2' : 'text-[9cqw] truncate'}`}
            >
              {nameText}
            </div>
            {/* NEW tag — same styling as RelicItem's; shown when the build was
                created or renamed today */}
            {isNew && (
              <div className='shrink-0 bg-amber-900/90 border border-amber-500/40 rounded px-1.5 flex items-center'
                style={{ boxShadow: '0 0 8px rgba(245,158,11,0.5), 0 0 20px rgba(245,158,11,0.2)' }}>
                <span className='afacad-bold text-[3.5cqw] text-amber-200'>NEW</span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-1 px-2 -mt-1 min-w-0'>
            {rarity > 0 && (
              <div className={`shrink-0 flex items-center gap-0.5 rounded pr-0.5  ${rarityPillText(rarity)}`}>
                <span className='afacad-bold text-[9px] leading-none'>{rarity}</span>
                <FaStar size={8} />
              </div>
            )}
            <div className='afacad-light text-white text-[6cqw] truncate min-w-0'>{(buildLabel !== 'Current') ? avatarName : buildLabel}</div>
          </div>

          {/* date + CV tag share one row so the CV badge sits at the same
              level as the date instead of being pushed onto its own line
              (which was overflowing the card via mt-auto/self-end before). */}
          <div className='flex items-center justify-between gap-[2cqw] px-2'>
            {dateText ? (
              <div
                className='afacad-semi-bold text-white/80 text-[5.5cqw] whitespace-nowrap flex items-center gap-[1cqw] min-w-0'
                onMouseEnter={() => setDateHovered(true)}
                onMouseLeave={() => setDateHovered(false)}
              >
                {isUpdatedDate ? <MdEdit className='shrink-0' /> : <MdAdd className='shrink-0' />}
                {dateText}
              </div>
            ) : <span />}

            <div
              ref={cvBadgeRef}
              className={`shrink-0 flex items-center rounded px-1.5 py-0.5 cursor-pointer transition ${buildCvBadgeBg(cv)}`}
              onMouseEnter={() => handleCVHover(true)}
              onMouseLeave={() => handleCVHover(false)}
            >
              <span className={`afacad-bold text-[10px] leading-none ${buildCvBadgeText(cv)}`}>{cv.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* divider — notches punch the card edge where this meets it. `relative`
            anchors the skin toggle without changing the divider's own offsetLeft
            (the notch math measures against the card, its offsetParent). */}
        <div ref={dividerRef} className="relative self-stretch my-2 w-px bg-white/10 shrink-0">
          {skins.length > 1 && (
            <div
              ref={skinBtnRef}
              className='absolute top-0 right-full m-1 text-white/60 hover:text-white cursor-pointer transition'
              onClick={handleSkinClick}
              onMouseEnter={() => handleSkinHover(true)}
              onMouseLeave={() => handleSkinHover(false)}
            >
              <IoShirtOutline size={12} />
            </div>
          )}
        </div>
        {showSkinTooltip && createPortal(
          <div
            className='fixed z-50 pointer-events-none -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5'
            style={{ top: skinTooltipPos.top, left: skinTooltipPos.left }}
          >
            <span className='text-white/60 afacad-light text-xs whitespace-nowrap'>
              {justCycled ? <span className='text-white afacad-bold'>{skinLabel}</span> : 'toggle skin'}
            </span>
          </div>,
          document.body
        )}

        {/* path + element icons — right of the divider, kept small (w-4) so
            they don't eat into the card/detail area's width. */}
        <div ref={iconColRef} className='shrink-0 mr-2.5 flex flex-col items-center justify-center gap-1'>
          {pathIcon && <img src={pathIcon} alt="" className='w-4.5 aspect-square object-contain' />}
          {elementIcon && <img src={elementIcon} alt="" className='w-4.5 aspect-square object-contain' />}
        </div>
        {showCVTooltip && createPortal(
          <div
            className='fixed z-50 pointer-events-none -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5'
            style={{ top: cvTooltipPos.top, left: cvTooltipPos.left }}
          >
            <span className='text-white/60 afacad-light text-xs whitespace-nowrap'>
              <span className='text-white afacad-bold'>{cv.toFixed(1)}</span> CV
            </span>
          </div>,
          document.body
        )}
      </div>
    </motion.div>
  );
}

export default BuildScrollItem;

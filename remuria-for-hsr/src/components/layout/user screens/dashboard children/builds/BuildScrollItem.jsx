import { motion, useTransform } from 'framer-motion';
import { characterIconUrl, displayBuildName } from './buildConstants';

// The left window border is a chord of an imaginary circle of radius ARC_RADIUS; each
// item's right edge sits on that circle's arc. At screen-center (d=0) the arc is
// ARC_BULGE px away from the chord (max protrusion, i.e. the focused item); at
// |d| >= ARC_RADIUS the arc meets the chord again (items sit flush against the border).
// A circle's curvature at its own peak is 1/R, so R has to be kept close to itemHeight
// or the arc is nearly flat near the center — a much larger radius (e.g. several times
// itemHeight) makes the immediate neighbor barely distinguishable from the focused item.
const ARC_RADIUS = 180;
const ARC_BULGE = 46;

function BuildScrollItem({ build, index, itemHeight, y, isFocused, onSelect, onCharacterFilterClick }) {
  const d = useTransform(y, (v) => index * itemHeight + v); // px distance from viewport center
  const x = useTransform(d, (dist) => {
    const clamped = Math.min(Math.abs(dist), ARC_RADIUS);
    return Math.max(Math.sqrt(ARC_RADIUS * ARC_RADIUS - clamped * clamped) - (ARC_RADIUS - ARC_BULGE), 0);
  });
  const scale = useTransform(d, (dist) => Math.max(1 - (Math.abs(dist) / itemHeight) * 0.08, 0.6));
  const opacity = useTransform(d, (dist) => Math.max(1 - (Math.abs(dist) / itemHeight) * 0.16, 0.3));
  const zIndex = useTransform(d, (dist) => Math.round(100 - Math.min(Math.abs(dist) / itemHeight, 50)));

  const buildLabel = displayBuildName(build.buildName) ?? (build.isStatic ? 'Current' : 'Build');

  return (
    <motion.div
      className="absolute left-0 px-2 cursor-pointer select-none"
      // Width reserves ARC_BULGE px on the right so the focused item's rightward arc
      // shift never pushes its box past the strip's own container edge into whatever
      // sits beside it.
      style={{ top: index * itemHeight - itemHeight / 2, height: itemHeight, width: `calc(100% - ${ARC_BULGE}px)`, x, scale, opacity, zIndex }}
      onClick={onSelect}
    >
      <div className={`h-full w-full flex flex-col items-center justify-center gap-1 overflow-hidden ${isFocused ? 'border' : ''}`}>
        <img
          src={characterIconUrl(build.avatarId)}
          alt=""
          className="w-10 h-10 rounded-full object-cover shrink-0"
          onClick={(e) => { e.stopPropagation(); onCharacterFilterClick?.(build.avatarId); }}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
        <span className="text-[10px] truncate max-w-full px-1">{buildLabel}</span>
        <span className="tabular-nums text-[11px]">{(build.cv ?? 0).toFixed(1)}</span>
      </div>
    </motion.div>
  );
}

export default BuildScrollItem;

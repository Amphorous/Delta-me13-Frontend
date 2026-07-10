import { useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import BuildScrollItem from './BuildScrollItem';
import useBuildScrollSync from './useBuildScrollSync';

const ITEM_HEIGHT = 88;

function BuildScrollList({ builds, onFocusChange, onCharacterFilterClick, skinSelections, onCycleSkin }) {
  const y = useMotionValue(0);
  const count = builds.length;
  const { focusedIndex } = useBuildScrollSync(y, count, ITEM_HEIGHT);

  const minY = -(Math.max(count - 1, 0)) * ITEM_HEIGHT;
  const maxY = 0;

  function snapTo(index) {
    const clamped = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
    animate(y, -clamped * ITEM_HEIGHT, { type: 'spring', stiffness: 380, damping: 40 });
  }

  // Mouse-wheel support: move y directly by the wheel delta while scrolling, then
  // snap to the nearest slot a short beat after the wheel goes quiet (same debounce
  // idea as a drag release, just keyed off wheel events instead of a drag gesture).
  const wheelSnapTimeout = useRef(null);
  useEffect(() => () => { if (wheelSnapTimeout.current) clearTimeout(wheelSnapTimeout.current); }, []);

  function handleWheel(event) {
    event.preventDefault();
    const next = Math.min(Math.max(y.get() - event.deltaY, minY), maxY);
    y.set(next);
    if (wheelSnapTimeout.current) clearTimeout(wheelSnapTimeout.current);
    wheelSnapTimeout.current = setTimeout(() => {
      snapTo(Math.round(-y.get() / ITEM_HEIGHT));
    }, 150);
  }

  // Reset scroll position whenever the underlying list changes (new page/filter/sort).
  const prevBuildsRef = useRef(builds);
  useEffect(() => {
    if (prevBuildsRef.current !== builds) {
      y.set(0);
      prevBuildsRef.current = builds;
    }
  }, [builds, y]);

  useEffect(() => {
    onFocusChange?.(builds[focusedIndex] ?? null, focusedIndex);
  }, [focusedIndex, builds, onFocusChange]);

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center px-2">
        No builds found.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-grady-950/70 backdrodp-blur-md rodunded-r-[90%] [will-change:backdrop-filter] [transform:translateZ(0)]" onWheel={handleWheel}>
      <motion.div
        className="absolute left-0 top-1/2 w-full"
        style={{ y }}
        drag="y"
        dragConstraints={{ top: minY, bottom: maxY }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={(event, info) => {
          // Project the fling forward by a short window, then hard-snap to whichever
          // slot that lands on — a single deterministic spring, not Framer's own
          // momentum decay (which was fighting this snap and rubber-banding at rest).
          const PROJECT_SECONDS = 0.15;
          const projected = y.get() + info.velocity.y * PROJECT_SECONDS;
          snapTo(Math.round(-projected / ITEM_HEIGHT));
        }}
      >
        {builds.map((build, index) => (
          <BuildScrollItem
            key={build.id}
            build={build}
            index={index}
            itemHeight={ITEM_HEIGHT}
            y={y}
            isFocused={index === focusedIndex}
            onSelect={() => snapTo(index)}
            onCharacterFilterClick={onCharacterFilterClick}
            skinIndex={skinSelections?.[build.avatarId] ?? 0}
            onCycleSkin={onCycleSkin}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default BuildScrollList;

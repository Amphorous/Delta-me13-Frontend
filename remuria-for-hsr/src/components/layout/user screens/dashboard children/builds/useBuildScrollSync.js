import { useEffect, useState } from 'react';

// Subscribes to a Framer Motion value driving a virtualized list's scroll offset and
// derives the nearest slot index from it, live. Earlier this debounced the index by
// ~200ms to avoid thrashing an expensive detail panel while flinging past rows, but the
// detail panel only reads already-in-memory data (no fetch/effect), so there's nothing
// to protect — debouncing just added a felt delay before the focus visibly changed.
export default function useBuildScrollSync(y, itemCount, itemHeight) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (itemCount === 0) return undefined;

    const unsubscribe = y.on('change', (value) => {
      const index = Math.min(Math.max(Math.round(-value / itemHeight), 0), itemCount - 1);
      setFocusedIndex(index);
    });

    return unsubscribe;
  }, [y, itemCount, itemHeight]);

  return { focusedIndex };
}

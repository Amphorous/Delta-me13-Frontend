/**
 * useCutouts — generates a CSS mask that punches holes in a target element.
 *
 * Usage:
 *   import { useCutouts } from '../../CutoutUtil';
 *
 *   const frameRef = useRef(null);
 *   const badgeRef = useRef(null);
 *
 *   // Rectangular hole — punches badgeRef's bounding box out of frameRef
 *   const style = useCutouts(frameRef, [
 *       { ref: badgeRef, type: 'rect', padding: 4 },
 *   ], [data]);
 *
 *   // Semicircular notch — ticket-stub holes at target's own edges
 *   const style = useCutouts(cardRef, [
 *       { ref: markerRef, type: 'notch', radius: 10 },
 *   ], [data]);
 *
 *   // Notch at a PARENT's edges (target is inset from visual boundary)
 *   const style = useCutouts(frameRef, [
 *       { ref: markerRef, type: 'notch', radius: 5, container: cardRef },
 *   ], [data]);
 *
 *   // Notch on only one edge
 *   const style = useCutouts(targetRef, [
 *       { ref: markerRef, type: 'notch', radius: 8, edges: ['bottom'] },
 *   ], [data]);
 *
 *   // Mix multiple cutouts on one target
 *   const style = useCutouts(frameRef, [
 *       { ref: dividerRef, type: 'notch', radius: 5, container: cardRef },
 *       { ref: barcodeRef, type: 'rect', padding: 4 },
 *   ], [data]);
 *
 *   // Spread the result onto the target element:
 *   <div ref={frameRef} style={style} className="border-dashed ...">
 *
 * Spec types:
 *   rect  — { ref, type: 'rect', padding?: number }
 *            Cuts a rectangular hole matching ref's bounding box (+ padding).
 *
 *   notch — { ref, type: 'notch', radius?: number, edges?: ('top'|'bottom')[], container?: RefObject }
 *            Cuts semicircular notches at the target's edges, x-aligned with ref.
 *            `edges` defaults to ['top', 'bottom']. `container` positions the
 *            notch at the container's edges instead of the target's own edges.
 *
 * @param {RefObject} targetRef — the element to mask
 * @param {Array} specs — array of cutout specs (see above)
 * @param {Array} deps — extra dependencies that trigger recalculation
 * @returns {object|undefined} — style object to spread onto targetRef's element
 */

import { useEffect, useState } from 'react';
export function useCutouts(targetRef, specs, deps = []) {
    const [style, setStyle] = useState(undefined);

    useEffect(() => {
        function update() {
            if (!targetRef.current) return;
            const targetRect = targetRef.current.getBoundingClientRect();

            const layers = [];
            const composites = [];
            const webkitComposites = [];

            for (const spec of specs) {
                if (!spec.ref?.current) continue;
                const cutoutRect = spec.ref.current.getBoundingClientRect();

                if (spec.type === 'notch') {
                    const radius = spec.radius ?? 10;
                    const edges = spec.edges ?? ['top', 'bottom'];
                    const cx = cutoutRect.left + cutoutRect.width / 2 - targetRect.left;

                    let topY = '0%';
                    let bottomY = '100%';
                    if (spec.container?.current) {
                        const containerRect = spec.container.current.getBoundingClientRect();
                        topY = `${containerRect.top - targetRect.top}px`;
                        bottomY = `${containerRect.bottom - targetRect.top}px`;
                    }

                    if (edges.includes('top')) {
                        layers.push(`radial-gradient(circle ${radius}px at ${cx}px ${topY}, transparent 99%, #000 100%)`);
                        composites.push('intersect');
                        webkitComposites.push('source-in');
                    }
                    if (edges.includes('bottom')) {
                        layers.push(`radial-gradient(circle ${radius}px at ${cx}px ${bottomY}, transparent 99%, #000 100%)`);
                        composites.push('intersect');
                        webkitComposites.push('source-in');
                    }
                }

                if (spec.type === 'rect') {
                    const pad = spec.padding ?? 4;
                    const x1 = cutoutRect.left - targetRect.left - pad;
                    const x2 = cutoutRect.right - targetRect.left + pad;
                    const y1 = cutoutRect.top - targetRect.top - pad;
                    const y2 = cutoutRect.bottom - targetRect.top + pad;

                    layers.push(
                        `linear-gradient(to right, #000 0, #000 ${x1}px, transparent ${x1}px, transparent ${x2}px, #000 ${x2}px, #000 100%)`,
                        `linear-gradient(to bottom, #000 0, #000 ${y1}px, transparent ${y1}px, transparent ${y2}px, #000 ${y2}px, #000 100%)`
                    );
                    composites.push('add', 'add');
                    webkitComposites.push('source-over', 'source-over');
                }
            }

            if (layers.length === 0) {
                setStyle(undefined);
                return;
            }

            // bottom-most layer composites onto an empty canvas — must use add/source-over
            composites[composites.length - 1] = 'add';
            webkitComposites[webkitComposites.length - 1] = 'source-over';

            setStyle({
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
        if (targetRef.current) ro.observe(targetRef.current);
        for (const spec of specs) {
            if (spec.ref?.current) ro.observe(spec.ref.current);
            if (spec.container?.current) ro.observe(spec.container.current);
        }

        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, deps);

    return style;
}

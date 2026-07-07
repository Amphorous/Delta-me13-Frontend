/**
 * ExpandableRefreshButton — a pill button that expands on hover to reveal a label,
 * with built-in loading spinner and success/error feedback states.
 *
 * Usage:
 *   import ExpandableRefreshButton from '../../ExpandableRefreshButton';
 *
 *   <ExpandableRefreshButton
 *       onClick={() => doRefresh()}
 *       enabled={canRefresh}
 *       loading={isLoading}
 *       countdown={secondsRemaining}
 *   />
 *
 * Props:
 *   onClick   () => void    Callback when clicked.
 *   enabled   boolean       true = interactive pill, false = countdown state.
 *   loading   boolean       true = spinning indicator while request is in flight.
 *   countdown number        Seconds shown in the disabled/cooldown state.
 *   label     string        Text shown on hover expand (default "Refresh").
 *   icon      node          Trailing icon in the idle state (default <IoMdRefresh />).
 *
 * Visual states (in priority order):
 *   1. loading=true        → spinning icon, non-interactive
 *   2. showDone (internal) → green "Done" pill, auto-clears after 1.5s
 *   3. enabled=false       → "{countdown}s" with static icon, cursor-not-allowed
 *   4. enabled=true        → expandable hover pill (idle)
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdRefresh } from "react-icons/io";
import { IoCheckmark } from "react-icons/io5";

const FADE = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeInOut' },
};

function ExpandableRefreshButton({ onClick, enabled, loading = false, countdown, label = "Refresh", icon = <IoMdRefresh /> }) {
    const [hovered, setHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const measureRef = useRef(null);
    const [expandedWidth, setExpandedWidth] = useState(0);
    const [showDone, setShowDone] = useState(false);
    const prevLoading = useRef(loading);

    useLayoutEffect(() => {
        if (measureRef.current) {
            setExpandedWidth(measureRef.current.offsetWidth);
        }
    }, [label]);

    useEffect(() => {
        if (prevLoading.current && !loading) {
            setShowDone(true);
            const timer = setTimeout(() => setShowDone(false), 1500);
            prevLoading.current = loading;
            return () => clearTimeout(timer);
        }
        prevLoading.current = loading;
    }, [loading]);

    return (
        <>
            <AnimatePresence mode="wait" initial={false}>
                {showDone ? (
                    <motion.div
                        key="done"
                        {...FADE}
                        className="px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-green-800/60 border border-green-500/30 text-green-200 text-xs afacad-light"
                    >
                        <IoCheckmark /> Done
                    </motion.div>
                ) : loading ? (
                    <motion.div
                        key="loading"
                        {...FADE}
                        className="px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-white/5 border border-white/10 text-white/40 text-xs afacad-light"
                    >
                        <IoMdRefresh className="animate-spin" />
                    </motion.div>
                ) : !enabled ? (
                    <motion.div
                        key="cooldown"
                        {...FADE}
                        className="px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-white/5 border border-white/10 text-white/25 text-xs cursor-not-allowed afacad-light"
                    >
                        {countdown}s <IoMdRefresh />
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        {...FADE}
                        className={`flex items-center justify-center gap-1 overflow-hidden rounded-full cursor-pointer text-xs afacad-light py-0.5 ${isPressed ? 'bg-black/80 text-white' : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white hover:text-black/80'} transition-colors`}
                        animate={{ ...FADE.animate, width: hovered ? expandedWidth : 26 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => { setIsPressed(false); setHovered(false); }}
                        onMouseDown={() => setIsPressed(true)}
                        onMouseUp={() => setIsPressed(false)}
                        onClick={onClick}
                    >
                        <AnimatePresence initial={false}>
                            {hovered && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="whitespace-nowrap"
                                >
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {icon}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute invisible pointer-events-none h-0 overflow-hidden afacad-light">
                <div ref={measureRef} className="flex items-center justify-center gap-1 px-2.5 py-0.5">
                    <span>{label}</span>
                    {icon}
                </div>
            </div>
        </>
    );
}

export default ExpandableRefreshButton;

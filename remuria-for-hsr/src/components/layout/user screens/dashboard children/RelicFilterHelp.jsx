import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { STAT_ALIASES } from './relicConstants';
import headIcon from "../../../../assets/relicIcons/IconRelicHead.png"
import handsIcon from "../../../../assets/relicIcons/IconRelicHands.png"
import bodyIcon from "../../../../assets/relicIcons/IconRelicBody.png"
import footIcon from "../../../../assets/relicIcons/IconRelicFoot.png"
import neckIcon from "../../../../assets/relicIcons/IconRelicNeck.png"
import goodsIcon from "../../../../assets/relicIcons/IconRelicGoods.png"

const SLOT_OPTIONS = [
    { label: 'Head',   value: '1', icon: headIcon },
    { label: 'Hands',  value: '2', icon: handsIcon },
    { label: 'Body',   value: '3', icon: bodyIcon },
    { label: 'Feet',   value: '4', icon: footIcon },
    { label: 'Sphere', value: '5', icon: neckIcon },
    { label: 'Rope',   value: '6', icon: goodsIcon },
];

function SectionHeader({ children }) {
    return (
        <p className='text-white/35 afacad-bold text-[9px] tracking-[0.3em] uppercase select-none mb-1.5'>{children}</p>
    );
}

function RelicFilterHelp({ anchorRef, activeSort, activeFilter, activeTypeFilter, allSets = [], onSelectSort, onSelectFilter, onClose }) {
    const popupRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        if (!anchorRef?.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }, [anchorRef]);

    useEffect(() => {
        function handleClick(e) {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return createPortal(
        <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 w-[22rem] max-h-[70vh] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{ top: pos.top, left: pos.left }}
        >
            {/* Sort */}
            <SectionHeader>Sort</SectionHeader>
            <div className='flex flex-wrap gap-1 mb-3'>
                {STAT_ALIASES.map(entry => (
                    <button
                        key={entry.type}
                        className={`px-2 py-0.5 rounded-full text-[10px] afacad-light transition cursor-pointer ${activeSort === entry.type ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/50 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => onSelectSort(entry.type)}
                    >
                        {entry.display || entry.labels[0].toUpperCase()}
                    </button>
                ))}
            </div>

            <div className='h-px bg-white/5 mb-3' />

            {/* Filter — two columns: slot left, sets right */}
            <SectionHeader>Filter</SectionHeader>
            <div className='flex gap-3 mb-3'>
                {/* Slot */}
                <div className='flex flex-col gap-1'>
                    <span className='text-white/20 afacad-light text-[9px] uppercase mb-0.5'>Slot</span>
                    {SLOT_OPTIONS.map(slot => (
                        <button
                            key={slot.value}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] afacad-light transition cursor-pointer w-full ${activeTypeFilter?.value === slot.value ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/50 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => onSelectFilter({ field: 'type', value: slot.value, displayLabel: slot.label })}
                        >
                            <img src={slot.icon} className='w-3 h-3' />
                            {slot.label}
                        </button>
                    ))}
                </div>

                {/* Sets */}
                {allSets.length > 0 && (
                    <div className='flex-1 min-w-0'>
                        <span className='text-white/20 afacad-light text-[9px] uppercase mb-0.5 block'>Set</span>
                        <div className='flex flex-wrap gap-1 max-h-40 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full'>
                            {allSets.map(set => (
                                <button
                                    key={set.setId}
                                    className={`px-1.5 py-px rounded text-[9px] afacad-light transition cursor-pointer ${(activeFilter?.field === 'setId' && activeFilter?.value === set.setId) || (activeFilter?.field === 'setName' && activeFilter?.displayLabel === set.name) ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/40 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => onSelectFilter({ field: 'setId', value: set.setId, displayLabel: set.name })}
                                >
                                    {set.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className='h-px bg-white/5 mb-2' />

            {/* Tips */}
            <div className='text-white/25 afacad-light text-[10px] leading-relaxed'>
                <p>Click <span className='text-white/40'>set names</span>, <span className='text-white/40'>relic names</span>, or <span className='text-white/40'>slot icons</span> on cards to filter.</p>
                <p>Slot + set filters combine — e.g. "Hands from Musketeer".</p>
            </div>
        </motion.div>,
        document.body
    );
}

export default RelicFilterHelp;

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { PATH_OPTIONS, ELEMENT_OPTIONS, characterIconUrl, handleCharacterIconError } from './buildConstants';

function SectionHeader({ children }) {
    return (
        <p className='text-white/35 afacad-bold text-[9px] tracking-[0.3em] uppercase select-none mb-1.5'>{children}</p>
    );
}

// Close port of RelicFilterHelp.jsx (dashboard children/RelicFilterHelp.jsx) —
// same createPortal + anchor-relative positioning + outside-click-to-close +
// Framer Motion fade. Path/Element are a small, fixed, compile-time-known set
// (PATH_OPTIONS/ELEMENT_OPTIONS) so those two columns need no loading state;
// Character is a backend-fetched catalog (allAvatars/catalogLoading) exactly
// like RelicFilterHelp's own Set column, same loading/empty-state treatment.
function BuildFilterHelp({
    anchorRef,
    activeFilterByPath, activeFilterByElement, activeFilterByAvatarId,
    allAvatars = [], catalogLoading,
    onSelectPath, onSelectElement, onSelectCharacter,
    onClose,
}) {
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
            {/* Filter — two columns: Path left, Element right */}
            <SectionHeader>Filter</SectionHeader>
            <div className='flex gap-3 mb-3'>
                <div className='flex-1 min-w-0'>
                    <span className='text-white/20 afacad-light text-[9px] uppercase mb-0.5 block'>Path</span>
                    <div className='flex flex-wrap gap-1'>
                        {PATH_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`flex items-center gap-1 px-1.5 py-px rounded text-[9px] afacad-light transition cursor-pointer ${activeFilterByPath === opt.value ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/40 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => onSelectPath(opt.value)}
                            >
                                <img src={opt.icon} alt="" className='w-3 h-3 object-contain' />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='flex-1 min-w-0'>
                    <span className='text-white/20 afacad-light text-[9px] uppercase mb-0.5 block'>Element</span>
                    <div className='flex flex-wrap gap-1'>
                        {ELEMENT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`flex items-center gap-1 px-1.5 py-px rounded text-[9px] afacad-light transition cursor-pointer ${activeFilterByElement === opt.value ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/40 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => onSelectElement(opt.value)}
                            >
                                <img src={opt.icon} alt="" className='w-3 h-3 object-contain' />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className='h-px bg-white/5 mb-3' />

            {/* Character — same loading/empty-state treatment as RelicFilterHelp's Set column */}
            <SectionHeader>Character</SectionHeader>
            <div className='mb-3'>
                {catalogLoading ? (
                    <div className='flex items-center gap-2 py-3 justify-center text-white/25 afacad-light text-xs'>
                        <div className='w-3.5 h-3.5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin' />
                        Loading characters...
                    </div>
                ) : allAvatars.length > 0 ? (
                    <div className='flex flex-wrap gap-1 max-h-40 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full'>
                        {allAvatars.map(avatar => (
                            <button
                                key={avatar.avatarId}
                                className={`flex items-center gap-1 px-1.5 py-px rounded text-[9px] afacad-light transition cursor-pointer ${activeFilterByAvatarId === avatar.avatarId ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]' : 'bg-white/5 text-white/40 hover:bg-[var(--accent-bg-20)] hover:text-white'}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => onSelectCharacter(avatar.avatarId)}
                            >
                                <img src={characterIconUrl(avatar.avatarId)} alt="" className='w-3 h-3 rounded-full object-cover' onError={handleCharacterIconError} />
                                {avatar.displayName ?? avatar.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className='text-white/20 afacad-light text-[9px] py-2'>No characters available</p>
                )}
            </div>

            <div className='h-px bg-white/5 mb-2' />

            {/* Tips */}
            <div className='text-white/25 afacad-light text-[10px] leading-relaxed'>
                <p>Click a <span className='text-white/40'>path</span> or <span className='text-white/40'>element</span> icon on the build detail card to filter, or search/pick a <span className='text-white/40'>character</span> by name above.</p>
                <p>Path + Element filters combine — e.g. "Fire AND Destruction". Character is its own filter (replaces Path/Element when selected).</p>
            </div>
        </motion.div>,
        document.body
    );
}

export default BuildFilterHelp;

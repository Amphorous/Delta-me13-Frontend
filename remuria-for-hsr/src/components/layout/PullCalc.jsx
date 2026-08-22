import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import genshinIcon from '../../assets/genshin_icon.png';
import honkerIcon from '../../assets/honker_icon.png';
import GenshinPullCalcForm from './pull calc/GenshinPullCalcForm';
import { WIDTH_CLASSES } from './Settings';

const GAMES = [
    { key: 'genshin', label: 'Genshin Impact', icon: genshinIcon },
    { key: 'starrail', label: 'Honkai: Star Rail', icon: honkerIcon },
];

const WIDTH_OPTIONS = [
    { key: 'sm', label: 'Small' },
    { key: 'md', label: 'Medium' },
    { key: 'lg', label: 'Large' },
];

function GameToggle({ game, onChange }) {
    return (
        <div className='flex gap-1.5 bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl p-1.5'>
            {GAMES.map(({ key, label, icon }) => {
                const active = game === key;
                return (
                    <button
                        key={key}
                        type='button'
                        onClick={() => onChange(key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg afacad-semi-bold text-xs transition-all cursor-pointer select-none
                            ${active
                                ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-60)] text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <img src={icon} alt='' className='w-5 h-5 rounded-full object-cover' />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

function WidthSelector({ width, onChange }) {
    return (
        <div className='flex gap-1'>
            {WIDTH_OPTIONS.map(({ key, label }) => {
                const active = width === key;
                return (
                    <button
                        key={key}
                        type='button'
                        onClick={() => onChange(key)}
                        className={`px-2.5 py-1 rounded-lg afacad-semi-bold text-[10px] transition-all cursor-pointer select-none
                            ${active
                                ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-60)] text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

function ComingSoon({ icon, title }) {
    return (
        <div className='w-full flex items-center justify-center py-16'>
            <div className='flex flex-col items-center text-center max-w-md'>
                <img src={icon} alt='' className='w-12 h-12 rounded-full object-cover mb-3' />
                <div className='afacad-bold text-white text-xl mb-1'>{title}</div>
                <p className='afacad-light text-white/50 text-sm'>Coming soon.</p>
            </div>
        </div>
    );
}

function PullCalc() {
    const [game, setGame] = useState('genshin');
    const [width, setWidth] = useState('md');
    const cardMaxW = WIDTH_CLASSES[width] ?? WIDTH_CLASSES.md;

    return (
        <div className='w-full h-full overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/35 flex justify-center p-6'>
            <div className={`@container w-full ${cardMaxW} self-start bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-6`}>

                <div className='flex items-start justify-between flex-wrap gap-4 mb-6'>
                    <div>
                        <p className='libre-baskerville-bold text-white mb-1' style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
                            Pull Calc
                        </p>
                        <p className='afacad-light text-white/50 text-sm'>
                            Estimate how many wishes/pulls you'll have by a future date.
                        </p>
                    </div>
                    <div className='flex flex-col items-end gap-2'>
                        <GameToggle game={game} onChange={setGame} />
                        <WidthSelector width={width} onChange={setWidth} />
                    </div>
                </div>

                <AnimatePresence mode='wait'>
                    {game === 'genshin' ? (
                        <motion.div key='genshin' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <GenshinPullCalcForm />
                        </motion.div>
                    ) : (
                        <motion.div key='starrail' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <ComingSoon icon={honkerIcon} title='Honkai: Star Rail Pull Calc' />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default PullCalc;

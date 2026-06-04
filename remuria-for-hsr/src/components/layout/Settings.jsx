import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { IoIosArrowDown } from 'react-icons/io';
import { toggleSetting, setBackgroundImage, setCardBackgroundImage, selectSettings } from '../../store/settingsSlice';
import { backgroundImages, cardBackgroundImages } from '../../assets/backgroundImages';

// ─── primitives ──────────────────────────────────────────────────────────────

function Toggle({ on }) {
    return (
        <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0
            ${on ? 'bg-violet-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                ${on ? 'translate-x-[1.625rem]' : 'translate-x-0.5'}`} />
        </div>
    );
}

function SettingsRow({ label, description, settingKey }) {
    const dispatch = useDispatch();
    const value = useSelector(state => state.settings[settingKey]);

    return (
        <div
            className='flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors select-none'
            onClick={() => dispatch(toggleSetting(settingKey))}
        >
            <div className='flex flex-col min-w-0 pr-6'>
                <p className='text-white afacad-semi-bold text-sm'>{label}</p>
                {description && (
                    <p className='text-white/35 afacad-light text-xs mt-0.5'>{description}</p>
                )}
            </div>
            <Toggle on={!!value} />
        </div>
    );
}

function Section({ title, children }) {
    return (
        <motion.div
            className='mb-6'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className='flex items-center gap-3 mb-2 px-1'>
                <span className='text-white/30 afacad-bold text-[10px] tracking-[0.35em] uppercase select-none'>
                    {title}
                </span>
                <div className='flex-1 h-px bg-white/10' />
            </div>
            <div className='bg-gray-900/50 backdrop-blur-md rounded-xl overflow-hidden divide-y divide-white/5'>
                {children}
            </div>
        </motion.div>
    );
}

// ─── image picker row ─────────────────────────────────────────────────────────

function ImagePickerRow({ images, activeKey, onSelect }) {
    const [open, setOpen] = useState(false);
    const active = images.find(b => b.key === activeKey) ?? images[0];

    return (
        <div>
            <div
                className='flex items-center px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors select-none'
                onClick={() => setOpen(o => !o)}
            >
                {active && (
                    <img src={active.url} alt={active.key} className='w-14 h-9 rounded-lg object-cover shrink-0 ring-1 ring-white/10' />
                )}
                <span className='text-white afacad-semi-bold text-sm ml-3 flex-1 truncate'>
                    {active?.filename ?? '—'}
                </span>
                <span className='text-white/40 afacad-light text-xs mr-2'>
                    {open ? 'Close' : 'Change'}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <IoIosArrowDown className='text-white/40' size={14} />
                </motion.div>
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key='picker'
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className='overflow-hidden'
                    >
                        <div className='px-4 pb-4 pt-4'>
                            <div className='flex flex-wrap gap-3 p-1 max-h-[180px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                                {images.map((bg) => {
                                    const isActive = bg.key === activeKey;
                                    return (
                                        <div
                                            key={bg.key}
                                            onClick={() => onSelect(bg.key)}
                                            className={`relative rounded-xl overflow-hidden cursor-pointer w-32 h-20 shrink-0 transition-all duration-200
                                                ${isActive
                                                    ? 'ring-2 ring-violet-500 scale-[1.03]'
                                                    : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.02]'
                                                }`}
                                        >
                                            <img src={bg.url} alt={bg.key} className='w-full h-full object-cover' />
                                            <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2'>
                                                <span className='text-white afacad-light text-[10px] truncate'>{bg.filename}</span>
                                            </div>
                                            {isActive && (
                                                <div className='absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center'>
                                                    <div className='w-1.5 h-1.5 rounded-full bg-white' />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BackgroundSelector() {
    const dispatch = useDispatch();
    const settings = useSelector(selectSettings);
    return (
        <ImagePickerRow
            images={backgroundImages}
            activeKey={settings.backgroundImageKey}
            onSelect={(key) => dispatch(setBackgroundImage(key))}
        />
    );
}

function CardBackgroundSelector() {
    const dispatch = useDispatch();
    const settings = useSelector(selectSettings);
    return (
        <ImagePickerRow
            images={cardBackgroundImages}
            activeKey={settings.cardBackgroundImageKey}
            onSelect={(key) => dispatch(setCardBackgroundImage(key))}
        />
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

function Settings() {
    return (
        <div className='w-full h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-8 py-6'>

            <p className='libre-baskerville-bold text-white mb-1' style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
                Settings
            </p>
            <p className='afacad-light text-white/30 text-sm mb-8'>
                Re<span className='text-violet-500/70'>:</span>muria preferences
            </p>

            <Section title="Relic">
                <SettingsRow
                    settingKey="relicAnimations"
                    label="Relic Rarity on Hover"
                    description="When on, the rarity sidebar on relic cards animates in on hover. When off, it is always visible."
                />
            </Section>

            <Section title="Background">
                <BackgroundSelector />
            </Section>

            <Section title="Card Background">
                <CardBackgroundSelector />
            </Section>

            <Section title="Data">
                <SettingsRow
                    settingKey="persistSettings"
                    label="Persist Settings"
                    description="Save your settings to local storage so they are restored on the next visit. Turning this off clears any saved settings immediately."
                />
            </Section>

        </div>
    );
}

export default Settings;

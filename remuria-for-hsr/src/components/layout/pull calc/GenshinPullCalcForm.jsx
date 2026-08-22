import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CgSpinner } from 'react-icons/cg';
import { FaCalculator } from 'react-icons/fa';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';
import RefreshWarningBanner from '../../RefreshWarningBanner';
import { getGenshinEndDate, calculateGenshinPulls } from '../../../utils/pullCalcApi';

const END_DATE_MODE_OPTIONS = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'DAYS_FROM_NOW', label: 'Days From Now' },
    { value: 'PATCH_PHASE_1', label: 'End of Phase 1' },
    { value: 'PATCH_PHASE_2', label: 'End of Phase 2' },
];

const CURRENCY_OPTIONS = [
    { value: 'PRIMOGEM', label: 'Primogems' },
    { value: 'FATE', label: 'Intertwined Fate' },
];

const STYGIAN_OPTIONS = [
    { value: 'SKIP', label: 'Skip' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'ADVANCING', label: 'Advancing' },
    { value: 'HARD', label: 'Hard' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

// ─── primitives ──────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }) {
    return (
        <div className='mb-1.5'>
            <label className='text-white afacad-semi-bold text-sm'>{children}</label>
            {hint && <p className='text-white/40 afacad-light text-xs mt-0.5'>{hint}</p>}
        </div>
    );
}

function NumberInput({ value, onChange, min = 0, max, placeholder = '0', width = 'w-full' }) {
    function step(delta) {
        const base = value === '' ? (min ?? 0) : Number(value);
        let next = base + delta;
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        onChange(String(next));
    }

    return (
        <div className={`relative ${width}`}>
            <input
                type='number'
                inputMode='numeric'
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className='w-full bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl pl-3 pr-7 py-2 text-white afacad-light text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
            <div className='absolute right-1 top-1/2 -translate-y-1/2 flex flex-col'>
                <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => step(1)}
                    className='text-white/40 hover:text-white transition-colors leading-none px-1 cursor-pointer'
                >
                    <IoIosArrowUp size={10} />
                </button>
                <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => step(-1)}
                    className='text-white/40 hover:text-white transition-colors leading-none px-1 cursor-pointer'
                >
                    <IoIosArrowDown size={10} />
                </button>
            </div>
        </div>
    );
}

function DateInput({ value, onChange }) {
    return (
        <input
            type='date'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='w-full [color-scheme:dark] bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white afacad-light text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]'
        />
    );
}

function PillSelect({ options, value, onChange }) {
    return (
        <div className='flex gap-2 flex-wrap'>
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        type='button'
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-lg afacad-semi-bold text-xs transition-all cursor-pointer select-none
                            ${active
                                ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-60)] text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <div className='@container bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl p-4'>
            <p className='text-white/55 afacad-bold text-[10px] tracking-[0.35em] uppercase mb-3'>{title}</p>
            {children}
        </div>
    );
}

// ─── result display ─────────────────────────────────────────────────────────

function ResultStat({ label, value, accent }) {
    return (
        <div className={`flex-1 min-w-[140px] rounded-xl px-4 py-3 border ${accent ? 'bg-[var(--accent-bg-20)] border-[var(--accent-border-60)]' : 'bg-white/5 border-white/10'}`}>
            <p className='text-white/50 afacad-light text-[10px] uppercase tracking-wider mb-1'>{label}</p>
            <p className={`afacad-bold text-2xl ${accent ? 'text-[var(--accent-text)]' : 'text-white'}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function BreakdownRow({ label, value }) {
    return (
        <div className='flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0'>
            <span className='text-white/60 afacad-light text-xs'>{label}</span>
            <span className='text-white afacad-semi-bold text-sm'>{value.toLocaleString()}</span>
        </div>
    );
}

function GenshinResult({ result }) {
    const { totals, totalPulls, totalPullsAfterSgReuse, totalDays, patchResetCount, patchResetDates, welkinDaysLeft } = result;
    const sgReuseGain = totalPullsAfterSgReuse - totalPulls;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className='mt-6'
        >
            <p className='text-white/55 afacad-bold text-[10px] tracking-[0.35em] uppercase mb-3'>Result</p>

            <div className='flex flex-wrap gap-3 mb-4'>
                <ResultStat label='Total Wishes' value={totalPulls} accent />
                <ResultStat label='With Starglitter Reuse' value={totalPullsAfterSgReuse} accent />
                <ResultStat label='Days Covered' value={totalDays} />
                <ResultStat label='Patch Resets' value={patchResetCount} />
            </div>

            {sgReuseGain > 0 && (
                <p className='text-white/40 afacad-light text-xs mb-4'>
                    +{sgReuseGain.toLocaleString()} extra wishes from converting leftover starglitter.
                </p>
            )}

            <div className='bg-black/20 border border-white/10 rounded-xl p-4 mb-4'>
                <p className='text-white/55 afacad-bold text-[10px] tracking-[0.35em] uppercase mb-2'>Primogem Breakdown</p>
                <BreakdownRow label='Daily Commissions / Welkin' value={totals.dailyTotal} />
                <BreakdownRow label='Spiral Abyss' value={totals.abyssTotal} />
                <BreakdownRow label='Imaginarium Theater' value={totals.imaginariumTotal} />
                <BreakdownRow label='Stygian Onslaught' value={totals.stygianTotal} />
                <BreakdownRow label='Monthly Rewards' value={totals.monthlyTotal} />
                <BreakdownRow label='Livestream Codes' value={totals.codes} />
                <BreakdownRow label='Patch Quests & Events' value={totals.patch} />
                <BreakdownRow label='Character Trials' value={totals.trials} />
            </div>

            {patchResetDates?.length > 0 && (
                <div>
                    <p className='text-white/55 afacad-bold text-[10px] tracking-[0.35em] uppercase mb-2'>Patch Reset Dates</p>
                    <div className='flex flex-wrap gap-1.5'>
                        {patchResetDates.map((d) => (
                            <span key={d} className='px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 afacad-light text-xs'>{d}</span>
                        ))}
                    </div>
                </div>
            )}

            <p className='text-white/35 afacad-light text-[11px] mt-4'>
                {welkinDaysLeft} Welkin Moon day{welkinDaysLeft === 1 ? '' : 's'} left over after this period.
            </p>
        </motion.div>
    );
}

// ─── form ────────────────────────────────────────────────────────────────────

function GenshinPullCalcForm() {
    const [startDate, setStartDate] = useState(todayIso());
    const [endDate, setEndDate] = useState('');
    const [endDateMode, setEndDateMode] = useState('MANUAL');
    const [endDateValue, setEndDateValue] = useState('');
    const [endDateLoading, setEndDateLoading] = useState(false);
    const [endDateError, setEndDateError] = useState(null);

    const [pity, setPity] = useState('');
    const [avgFourStarSgPerBanner, setAvgFourStarSgPerBanner] = useState('');
    const [currencyType, setCurrencyType] = useState('PRIMOGEM');
    const [startCurrencyAmount, setStartCurrencyAmount] = useState('');
    const [startStarglitter, setStartStarglitter] = useState('');
    const [welkinDaysLeft, setWelkinDaysLeft] = useState('');
    const [abyssStars, setAbyssStars] = useState(['', '', '', '']);
    const [imaginariumStars, setImaginariumStars] = useState('');
    const [stygianDifficulty, setStygianDifficulty] = useState('NORMAL');

    const [result, setResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState(null);
    const resultRef = useRef(null);

    useEffect(() => {
        if (result) {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [result]);

    function updateAbyssStar(index, value) {
        setAbyssStars((prev) => prev.map((v, i) => (i === index ? value : v)));
    }

    async function handleCalculateEndDate() {
        if (!startDate) {
            setEndDateError('Set a start date first.');
            return;
        }
        if (endDateValue === '') {
            setEndDateError('Enter a value.');
            return;
        }
        setEndDateLoading(true);
        setEndDateError(null);
        try {
            const data = await getGenshinEndDate({ startDate, mode: endDateMode, value: Number(endDateValue) || 0 });
            setEndDate(data.endDate);
        } catch (err) {
            setEndDateError(typeof err.response?.data === 'string' ? err.response.data : 'Failed to calculate end date.');
        } finally {
            setEndDateLoading(false);
        }
    }

    async function handleCalculate(e) {
        e.preventDefault();
        if (!startDate || !endDate) {
            setCalcError('Set both a start and end date.');
            return;
        }
        setCalcLoading(true);
        setCalcError(null);
        setResult(null);
        try {
            const data = await calculateGenshinPulls({
                startDate,
                endDate,
                pity: Number(pity) || 0,
                avgFourStarSgPerBanner: Number(avgFourStarSgPerBanner) || 0,
                currencyType,
                startCurrencyAmount: Number(startCurrencyAmount) || 0,
                startStarglitter: Number(startStarglitter) || 0,
                welkinDaysLeft: Number(welkinDaysLeft) || 0,
                abyssStars: abyssStars.map((v) => Number(v) || 0),
                imaginariumStars: Number(imaginariumStars) || 0,
                stygianDifficulty,
            });
            setResult(data);
        } catch (err) {
            setCalcError(typeof err.response?.data === 'string' ? err.response.data : 'Failed to calculate pulls.');
        } finally {
            setCalcLoading(false);
        }
    }

    return (
        <form onSubmit={handleCalculate} className='w-full'>

            <div className='grid gap-4 mb-4 items-start @7xl:grid-cols-2'>

            <SectionCard title='Dates'>
                <div className='grid gap-4 @lg:grid-cols-2'>
                    <div className='flex flex-col gap-4'>
                        <div>
                            <FieldLabel>Start Date</FieldLabel>
                            <DateInput value={startDate} onChange={setStartDate} />
                        </div>
                        <div>
                            <FieldLabel hint={endDateMode !== 'MANUAL' ? 'Calculated from the option on the right - you can still edit it directly.' : undefined}>
                                End Date
                            </FieldLabel>
                            <DateInput value={endDate} onChange={setEndDate} />
                        </div>
                    </div>

                    <div className='@lg:pl-4 @lg:border-l @lg:border-white/10'>
                        <FieldLabel hint='Optional - calculates the end date for you instead of picking one manually.'>
                            Calculate End Date
                        </FieldLabel>
                        <PillSelect
                            options={END_DATE_MODE_OPTIONS}
                            value={endDateMode}
                            onChange={(v) => { setEndDateMode(v); setEndDateError(null); }}
                        />

                        {endDateMode !== 'MANUAL' && (
                            <div className='flex items-end gap-2 mt-3'>
                                <div className='flex-1'>
                                    <FieldLabel>
                                        {endDateMode === 'DAYS_FROM_NOW' ? 'Days From Start Date' : 'Patches Ahead (0 = current patch)'}
                                    </FieldLabel>
                                    <NumberInput value={endDateValue} onChange={setEndDateValue} min={0} />
                                </div>
                                <button
                                    type='button'
                                    onClick={handleCalculateEndDate}
                                    disabled={endDateLoading}
                                    className='px-4 py-2 rounded-xl bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-60)] text-white afacad-semi-bold text-sm hover:bg-[var(--accent-bg-60)] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0'
                                >
                                    {endDateLoading && <CgSpinner className='animate-spin' size={16} />}
                                    Calculate
                                </button>
                            </div>
                        )}
                        {endDateError && <p className='text-red-400 afacad-light text-xs mt-2'>{endDateError}</p>}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title='Currency'>
                <div className='grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4'>
                    <div>
                        <FieldLabel>Currency Type</FieldLabel>
                        <PillSelect options={CURRENCY_OPTIONS} value={currencyType} onChange={setCurrencyType} />
                    </div>
                    <div>
                        <FieldLabel>{currencyType === 'FATE' ? 'Starting Intertwined Fate' : 'Starting Primogems'}</FieldLabel>
                        <NumberInput value={startCurrencyAmount} onChange={setStartCurrencyAmount} min={0} />
                    </div>
                    <div>
                        <FieldLabel hint='Used to convert leftover 4★ starglitter into extra wishes.'>Starting Starglitter</FieldLabel>
                        <NumberInput value={startStarglitter} onChange={setStartStarglitter} min={0} />
                    </div>
                    <div>
                        <FieldLabel hint='Remaining days of active Welkin Moon (extra 90 gems a day).'>Welkin Moon Days Left</FieldLabel>
                        <NumberInput value={welkinDaysLeft} onChange={setWelkinDaysLeft} min={0} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title='Pity & Starglitter'>
                <div className='grid gap-4 @lg:grid-cols-2'>
                    <div>
                        <FieldLabel hint='Your current pity count on the limited banner (0-89).'>Current Pity</FieldLabel>
                        <NumberInput value={pity} onChange={setPity} min={0} max={89} />
                    </div>
                    <div>
                        <FieldLabel hint='Average bonus starglitter gained each time your pity crosses a multiple of 10.'>Avg 4★ Starglitter Gain</FieldLabel>
                        <NumberInput value={avgFourStarSgPerBanner} onChange={setAvgFourStarSgPerBanner} min={0} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title='Events'>
                <div className='grid gap-6 @2xl:grid-cols-3'>
                    <div>
                        <FieldLabel hint='Stars earned per floor, Floors 9 through 12 (max 9 each).'>Spiral Abyss Stars</FieldLabel>
                        <div className='flex flex-wrap gap-3'>
                            {abyssStars.map((val, i) => (
                                <div key={i} className='flex flex-col items-center'>
                                    <p className='text-white/40 afacad-light text-[10px] uppercase mb-1'>Floor {9 + i}</p>
                                    <NumberInput value={val} onChange={(v) => updateAbyssStar(i, v)} min={0} max={9} width='w-16' />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <FieldLabel hint='Total stars earned in Imaginarium Theater (0–10).'>Imaginarium Theater Stars</FieldLabel>
                        <NumberInput value={imaginariumStars} onChange={setImaginariumStars} min={0} max={10} width='w-20' />
                    </div>

                    <div>
                        <FieldLabel>Stygian Onslaught Difficulty</FieldLabel>
                        <PillSelect options={STYGIAN_OPTIONS} value={stygianDifficulty} onChange={setStygianDifficulty} />
                    </div>
                </div>
            </SectionCard>

            </div>

            <RefreshWarningBanner
                warning={calcError ? { type: 'error', text: calcError } : null}
                onDismiss={() => setCalcError(null)}
            />

            <button
                type='submit'
                disabled={calcLoading || !startDate || !endDate}
                className='w-full mt-2 px-4 py-3 rounded-xl bg-[var(--accent-solid)] text-white afacad-bold text-sm hover:brightness-110 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
                {calcLoading ? <CgSpinner className='animate-spin' size={18} /> : <FaCalculator size={16} />}
                Calculate Pulls
            </button>

            {result && (
                <div ref={resultRef}>
                    <GenshinResult result={result} />
                </div>
            )}
        </form>
    );
}

export default GenshinPullCalcForm;

import React, { useEffect, useState } from 'react';
import { FaStar } from "react-icons/fa";
import headIcon from "../../../../assets/relicIcons/IconRelicHead.png"
import handsIcon from "../../../../assets/relicIcons/IconRelicHands.png"
import bodyIcon from "../../../../assets/relicIcons/IconRelicBody.png"
import footIcon from "../../../../assets/relicIcons/IconRelicFoot.png"
import neckIcon from "../../../../assets/relicIcons/IconRelicNeck.png"
import goodsIcon from "../../../../assets/relicIcons/IconRelicGoods.png"
import { useSelector } from "react-redux";
import { selectLoc } from '../../../../store/localisationSlice';
import axios from 'axios';
import iconAttack from "../../../../assets/downloaded_icons/IconAttack.png"
import iconBreakUp from "../../../../assets/downloaded_icons/IconBreakUp.png"
import iconCriticalChance from "../../../../assets/downloaded_icons/IconCriticalChance.png"
import iconCriticalDamage from "../../../../assets/downloaded_icons/IconCriticalDamage.png"
import iconDefence from "../../../../assets/downloaded_icons/IconDefence.png"
import iconFireAddedRatio from "../../../../assets/downloaded_icons/IconFireAddedRatio.png"
import iconIceAddedRatio from "../../../../assets/downloaded_icons/IconIceAddedRatio.png"
import iconImaginaryAddedRatio from "../../../../assets/downloaded_icons/IconImaginaryAddedRatio.png"
import iconJoy from "../../../../assets/downloaded_icons/IconJoy.png"
import iconMaxHP from "../../../../assets/downloaded_icons/IconMaxHP.png"
import iconPhysicalAddedRatio from "../../../../assets/downloaded_icons/IconPhysicalAddedRatio.png"
import iconQuantumAddedRatio from "../../../../assets/downloaded_icons/IconQuantumAddedRatio.png"
import iconSpeed from "../../../../assets/downloaded_icons/IconSpeed.png"
import iconStatusProbability from "../../../../assets/downloaded_icons/IconStatusProbability.png"
import iconStatusResistance from "../../../../assets/downloaded_icons/IconStatusResistance.png"
import iconThunderAddedRatio from "../../../../assets/downloaded_icons/IconThunderAddedRatio.png"
import iconWindAddedRatio from "../../../../assets/downloaded_icons/IconWindAddedRatio.png"
import iconSPRatio from "../../../../assets/downloaded_icons/IconSPRatio.png"

export const SHIMMER_CSS = `
@keyframes cv-shimmer-sweep {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
}
.cv-shimmer-red {
    background-image: linear-gradient(90deg, #fca5a5, #ef4444, #9f1239, #ef4444, #fca5a5);
    background-size: 400% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: cv-shimmer-sweep 1.8s linear infinite;
}
.cv-shimmer-jade {
    background-image: linear-gradient(90deg, #a5f3fc, #06b6d4, #0e7490, #06b6d4, #a5f3fc);
    background-size: 400% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: cv-shimmer-sweep 1.8s linear infinite;
}
.cv-glow-red  { text-shadow: 0 0 8px rgba(239,68,68,0.85), 0 0 18px rgba(239,68,68,0.4); }
.cv-glow-jade { text-shadow: 0 0 8px rgba(6,182,212,0.85), 0 0 18px rgba(6,182,212,0.4); }
.cv-glow-gold { text-shadow: 0 0 8px rgba(234,179,8,0.85),  0 0 18px rgba(234,179,8,0.4);  }
`;

function isRelicNew(creationDate) {
    if (!creationDate) return false;
    const created = new Date(creationDate);
    return (Date.now() - created.getTime()) < 24 * 60 * 60 * 1000;
}

function calcCV(relic) {
    let critRate = 0, critDmg = 0;
    (relic.subAffixes || []).forEach(sub => {
        if (!sub) return;
        const t = sub.type.toLowerCase();
        if (t.includes('criticalchance')) critRate = sub.value * 100;
        if (t.includes('criticaldamage')) critDmg = sub.value * 100;
    });
    return 2 * critRate + critDmg;
}

function cvClass(cv, shimmer) {
    const base = 'afacad-bold text-sm';
    if (cv >= 40) return `${shimmer ? 'cv-shimmer-red' : 'text-red-400'} cv-glow-red ${base}`;
    if (cv >= 30) return `${shimmer ? 'cv-shimmer-jade' : 'text-cyan-400'} cv-glow-jade ${base}`;
    if (cv >= 20) return `text-amber-400 cv-glow-gold ${base}`;
    if (cv >= 15) return `text-purple-400 ${base}`;
    return `text-blue-400 ${base}`;
}

function RelicList({ info, relicPageNumber, twoColumn, showCV, cvShimmer, onStatClick, sortBy, onFilterClick, activeFilter, activeTypeFilter }) {

    const [localisedRelicName, setLocalisedRelicName] = useState([]);
    const [localisedSetName, setLocalisedSetName] = useState([]);
    const selectedLoc = useSelector(selectLoc);

    useEffect(() => {
        if (!info || info.length === 0) return;

        const fetchLocalisationInfo = async () => {
            const promises = info.map((record) => {
                if (record?.relic) {
                    return axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/relic-info/${selectedLoc}/${record.relic.tid}`)
                        .then((res) => ({ relicName: res.data.ArtifactName, setName: res.data.SetName }))
                        .catch(() => ({ relicName: "Unknown", setName: "Unknown" }));
                }
                return Promise.resolve({ relicName: "", setName: "" });
            });

            const results = await Promise.all(promises);
            setLocalisedRelicName(results.map(r => r.relicName));
            setLocalisedSetName(results.map(r => r.setName));
        };

        fetchLocalisationInfo();
    }, [selectedLoc, info]);

    function imageGetter(metaArray) {
        if (metaArray) return `https://enka.network/ui/hsr/SpriteOutput/ItemIcon/RelicIcons/IconRelic_${metaArray[1]}_${metaArray[2]}.png`;
    }

    function relicIconGetter(metaArray) {
        if (!metaArray) return;
        switch (metaArray[2]) {
            case "1": return headIcon;
            case "2": return handsIcon;
            case "3": return bodyIcon;
            case "4": return footIcon;
            case "5": return neckIcon;
            case "6": return goodsIcon;
        }
    }

    function rarityBGColourGetter(metaArray) {
        if (!metaArray) return;
        switch (metaArray[0]) {
            case "6": return "bg-amber-400/40";
            case "5": return "bg-purple-400/40";
            case "4": return "bg-blue-400/40";
            case "3": return "bg-gray-400/40";
        }
    }

    function rarityTextColourGetter(metaArray) {
        if (!metaArray) return;
        switch (metaArray[0]) {
            case "6": return "text-amber-200/80";
            case "5": return "text-purple-200/80";
            case "4": return "text-blue-200/80";
            case "3": return "text-gray-200/80";
        }
    }

    function statImageGetter(statType) {
        const t = statType.toLowerCase();
        if (t.includes("attack"))                 return iconAttack;
        if (t.includes("break"))                  return iconBreakUp;
        if (t.includes("criticalchance"))         return iconCriticalChance;
        if (t.includes("criticaldamage"))         return iconCriticalDamage;
        if (t.includes("defence"))                return iconDefence;
        if (t.includes("fireaddedratio"))         return iconFireAddedRatio;
        if (t.includes("iceaddedratio"))          return iconIceAddedRatio;
        if (t.includes("imaginaryaddedratio"))    return iconImaginaryAddedRatio;
        if (t.includes("joy"))                    return iconJoy;
        if (t.includes("hp") || t.includes("heal")) return iconMaxHP;
        if (t.includes("physicaladdedratio"))     return iconPhysicalAddedRatio;
        if (t.includes("quantumaddedratio"))      return iconQuantumAddedRatio;
        if (t.includes("speed"))                  return iconSpeed;
        if (t.includes("statusprobability"))      return iconStatusProbability;
        if (t.includes("statusresistance"))       return iconStatusResistance;
        if (t.includes("thunderaddedratio"))      return iconThunderAddedRatio;
        if (t.includes("windaddedratio"))         return iconWindAddedRatio;
        if (t.includes("sp"))                     return iconSPRatio;
    }

    function statNameGetter(statType) {
        const t = statType.toLowerCase();
        if (t.includes("criticaldamage"))         return "CRIT DMG";
        if (t.includes("criticalchance"))         return "CRIT Rate";
        if (t.includes("attack"))                 return "ATK";
        if (t.includes("break"))                  return "Break";
        if (t.includes("defence"))                return "DEF";
        if (t.includes("fireaddedratio"))         return "Fire";
        if (t.includes("iceaddedratio"))          return "Ice";
        if (t.includes("imaginaryaddedratio"))    return "Imaginary";
        if (t.includes("heal"))                   return "Healing";
        if (t.includes("joy"))                    return "Elation";
        if (t.includes("hp"))                     return "HP";
        if (t.includes("physicaladdedratio"))     return "Physical";
        if (t.includes("quantumaddedratio"))      return "Quantum";
        if (t.includes("speed"))                  return "SPD";
        if (t.includes("statusprobability"))      return "Eff Hit";
        if (t.includes("statusresistance"))       return "Eff RES";
        if (t.includes("thunderaddedratio"))      return "Lightning";
        if (t.includes("windaddedratio"))         return "Wind";
        if (t.includes("sp"))                     return "Energy";
        return "";
    }

    function inlineStatValue(statValue, statType) {
        const isPercent = statType.toLowerCase().includes("ratio") ||
                          statType.toLowerCase().includes("chance") ||
                          statType.toLowerCase().includes("resistance") ||
                          statType.toLowerCase().includes("probability") ||
                          statType.toLowerCase().includes("criticaldamage");
        return isPercent ? `+${(statValue * 100).toFixed(1)}%` : `+${statValue.toFixed(1)}`;
    }

    function metaArrayGetter(tid) {
        return [tid.substring(0, 1), tid.substring(1, tid.length - 1), tid.substring(tid.length - 1)];
    }

    return (
        <>
            <style>{SHIMMER_CSS}</style>
            <div className='w-full'>

                {/* header — hidden in two-column mode since it can't span columns correctly */}
                {!twoColumn && (
                    <div className='flex items-center gap-3 px-3 py-1 mb-1 text-white/55 afacad-bold text-xs tracking-widest uppercase select-none'>
                        <div className='w-11 shrink-0' />
                        <div className='w-52 shrink-0'>Name</div>
                        <div className='w-10 text-center shrink-0'>Lvl</div>
                        <div className='w-44 shrink-0'>Main</div>
                        <div className='flex-1'>Substats</div>
                        {showCV && (
                            <div
                                className={`w-16 shrink-0 text-center py-1 rounded-t-md cursor-pointer transition select-none
                                    ${sortBy === 'CV'
                                        ? 'bg-[var(--accent-bg-40)] text-[var(--accent-muted)] ring-1 ring-[var(--accent-border-30)]'
                                        : 'bg-[var(--accent-bg-20)] text-[var(--accent-muted)] hover:bg-[var(--accent-bg-40)]'
                                    }`}
                                onClick={() => onStatClick?.('CV')}
                            >CV</div>
                        )}
                    </div>
                )}

                {/* rows */}
                <div className={twoColumn ? 'columns-2 gap-3' : 'flex flex-col gap-1'}>
                    {info && info.map((record, index) => {
                        if (!record || !record.relic) return null;
                        const relic = record.relic;
                        const metaArray = relic.tid ? metaArrayGetter(relic.tid) : [];
                        const cv = showCV ? calcCV(relic) : 0;

                        const hasSortedStat = sortBy && sortBy !== 'CV' && (
                            relic.mainType === sortBy ||
                            (relic.subAffixes || []).some(s => s?.type === sortBy)
                        );

                        const relicIndex = (relicPageNumber - 1) * 20 + index + 1;
                        const isOdd = index % 2 === 1;

                        return (
                            <div key={index}
                                className={`flex items-center gap-3 rounded-lg backdrop-blur-sm overflow-hidden transition-colors break-inside-avoid mb-1 relative ${hasSortedStat ? (isOdd ? 'bg-[var(--accent-bg-30)]' : 'bg-[var(--accent-bg-20)]') + ' ring-1 ring-[var(--accent-border-30)]' : isOdd ? 'bg-gray-800/50 hover:bg-gray-700/60' : 'bg-gray-900/50 hover:bg-gray-800/60'}`}
                            >
                                {/* index bubble */}
                                <div className='absolute top-0.5 left-1.5 z-10 bg-black/40 rounded-full w-4 h-4 flex items-center justify-center'>
                                    <span className='afacad-light text-white/30 text-[8px] leading-none'>{relicIndex}</span>
                                </div>

                                {/* rarity accent bar */}
                                <div className={`w-1 self-stretch shrink-0 ${rarityBGColourGetter(metaArray)}`} />

                                {/* piece image + slot icon */}
                                <div className='w-10 shrink-0 relative py-2'>
                                    <img src={imageGetter(metaArray)} alt=""
                                         className="w-10 h-10 object-contain cursor-pointer"
                                         onClick={() => onFilterClick?.('tid', relic.tid, localisedRelicName[index])}
                                    />
                                    <img src={relicIconGetter(metaArray)} alt=""
                                         className={`absolute bottom-1.5 right-0 w-4 h-4 object-contain bg-black/40 rounded-full p-0.5 cursor-pointer transition ${activeTypeFilter?.value === metaArray[2] ? 'opacity-100 ring-1 ring-[var(--accent-muted)]' : 'opacity-60 hover:opacity-100'}`}
                                         onClick={() => onFilterClick?.('type', metaArray[2], metaArray[2])}
                                    />
                                </div>

                                {/* name + set */}
                                <div className='w-52 shrink-0 min-w-0 py-2.5'>
                                    <div className='flex items-center gap-1.5'>
                                        <p className={`afacad-bold text-base leading-tight truncate cursor-pointer transition ${activeFilter?.field === 'tid' && activeFilter?.value === relic.tid ? 'text-[var(--accent-muted)]' : 'text-white hover:text-[var(--accent-muted)]'}`}
                                           onClick={() => onFilterClick?.('tid', relic.tid, localisedRelicName[index])}
                                        >{localisedRelicName[index]}</p>
                                        {isRelicNew(relic.creationDate) && (
                                            <span className='bg-amber-900/90 border border-amber-500/40 rounded px-1 py-px afacad-bold text-[9px] leading-none text-amber-200 shrink-0'
                                                  style={{ boxShadow: '0 0 6px rgba(245,158,11,0.4), 0 0 14px rgba(245,158,11,0.15)' }}>NEW</span>
                                        )}
                                    </div>
                                    <p className={`afacad-light text-xs truncate mt-0.5 cursor-pointer transition ${activeFilter?.field === 'setName' && activeFilter?.value === relic.setName ? 'text-[var(--accent-muted)]' : 'text-white/40 hover:text-[var(--accent-muted)]'}`}
                                       onClick={() => onFilterClick?.('setName', relic.setName, localisedSetName[index])}
                                    >{localisedSetName[index]}</p>
                                </div>

                                {/* level */}
                                <div className={`w-10 text-center afacad-bold text-sm shrink-0 ${rarityTextColourGetter(metaArray)}`}>
                                    +{relic.level === "null" ? 0 : relic.level}
                                </div>

                                {/* main stat */}
                                <div
                                    className={`w-44 shrink-0 flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition ${sortBy === relic.mainType ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-30)]' : 'hover:bg-white/5'}`}
                                    onClick={() => onStatClick?.(relic.mainType)}
                                >
                                    <img src={statImageGetter(relic.mainType)} alt="" className="w-5 h-5 object-contain shrink-0" />
                                    <span className='text-white/50 afacad-light text-sm whitespace-nowrap'>{statNameGetter(relic.mainType)}</span>
                                    <span className='text-white afacad-bold text-sm whitespace-nowrap'>{inlineStatValue(relic.mainValue, relic.mainType)}</span>
                                </div>

                                {/* substats */}
                                <div className={`flex-1 flex gap-2 py-2 ${!showCV ? 'pr-3' : ''}`}>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const sub = relic.subAffixes[i];
                                        return sub ? (
                                            <div
                                                key={i}
                                                title={`${statNameGetter(sub.type)} ${inlineStatValue(sub.value, sub.type)}`}
                                                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 w-[23%] min-w-0 shrink-0 cursor-pointer transition
                                                    ${sortBy === sub.type
                                                        ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-30)]'
                                                        : 'bg-black/25 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onStatClick?.(sub.type)}
                                            >
                                                <img src={statImageGetter(sub.type)} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                                                <span className='text-white/45 afacad-light text-xs whitespace-nowrap truncate flex-1'>{statNameGetter(sub.type)}</span>
                                                <span className='text-white afacad-semi-bold text-xs whitespace-nowrap'>{inlineStatValue(sub.value, sub.type)}</span>
                                            </div>
                                        ) : (
                                            <div key={i} className='bg-gray-800/30 rounded-md w-[23%] shrink-0 flex items-center justify-center text-white/15 text-xs py-1.5'>—</div>
                                        );
                                    })}
                                </div>

                                {/* CV column */}
                                {showCV && (
                                    <div
                                        className={`w-16 shrink-0 self-stretch flex items-center justify-center px-1 cursor-pointer transition ${sortBy === 'CV' ? 'bg-[var(--accent-bg-40)]' : 'bg-[var(--accent-bg-20)] hover:bg-[var(--accent-bg-40)]'}`}
                                        onClick={() => onStatClick?.('CV')}
                                    >
                                        <span className={cvClass(cv, cvShimmer)}>{cv.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default RelicList;

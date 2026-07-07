import axios from 'axios';
import { motion } from 'framer-motion';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSetting, selectRelicTwoColumn, selectRelicShowCV, selectRelicCVShimmer } from '../../../../store/settingsSlice';
import { selectLoc } from '../../../../store/localisationSlice';
import RelicItem from './RelicItem';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdSearch } from "react-icons/md";
import { TbColumns2 } from "react-icons/tb";
import Switcher1 from '../../../Switcher1';
import { BsFillGridFill } from "react-icons/bs";
import { FaList } from "react-icons/fa6";
import { IoHelpCircleOutline } from "react-icons/io5";
import RelicList from './RelicList';
import RelicFilterHelp from './RelicFilterHelp';
import { STAT_ALIASES, SLOT_ALIASES, slotDisplayName } from './relicConstants';
import headIcon from "../../../../assets/relicIcons/IconRelicHead.png"
import handsIcon from "../../../../assets/relicIcons/IconRelicHands.png"
import bodyIcon from "../../../../assets/relicIcons/IconRelicBody.png"
import footIcon from "../../../../assets/relicIcons/IconRelicFoot.png"
import neckIcon from "../../../../assets/relicIcons/IconRelicNeck.png"
import goodsIcon from "../../../../assets/relicIcons/IconRelicGoods.png"
import loadFail from "../../../../assets/Loading Failed.png"

const SLOT_OPTIONS = [
  { label: 'Head',   value: '1', icon: headIcon },
  { label: 'Hands',  value: '2', icon: handsIcon },
  { label: 'Body',   value: '3', icon: bodyIcon },
  { label: 'Feet',   value: '4', icon: footIcon },
  { label: 'Sphere', value: '5', icon: neckIcon },
  { label: 'Rope',   value: '6', icon: goodsIcon },
];

function resolveStatType(value) {
  const v = value.toLowerCase().trim();
  for (const entry of STAT_ALIASES) {
    if (entry.labels.some(l => v === l)) return entry.type;
  }
  for (const entry of STAT_ALIASES) {
    if (entry.labels.some(l => v.startsWith(l) || l.startsWith(v))) return entry.type;
  }
  return null;
}

function subsequenceMatch(query, candidate) {
  const q = query.toLowerCase(), c = candidate.toLowerCase();
  let qi = 0;
  for (let ci = 0; ci < c.length && qi < q.length; ci++)
    if (c[ci] === q[qi]) qi++;
  return qi === q.length;
}

function DashboardsRelics() {

  const dispatch = useDispatch();
  const twoColumn = useSelector(selectRelicTwoColumn);
  const showCV = useSelector(selectRelicShowCV);
  const cvShimmer = useSelector(selectRelicCVShimmer);
  const selectedLoc = useSelector(selectLoc);

  const { refreshKey } = useOutletContext() || {};

  const [relicPageNumber, setRelicPageNumber] = useState(1);
  const [relicsInfo, setRelicsInfo] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [relicShowcaseStyle, setRelicShowcaseStyle] = useState(true);
  const uid = useLocation().pathname.split("/")[2];

  const [sortBy, setSortBy] = useState('CV');
  const [filter, setFilter] = useState(null);        // set/relic/tid filter
  const [typeFilter, setTypeFilter] = useState(null); // slot type filter { value: '1', displayLabel: 'Head' }
  const [sortOrder, setSortOrder] = useState('DESC');

  // sort bar
  const [sortInputText, setSortInputText] = useState('');
  const [sortInputFocused, setSortInputFocused] = useState(false);
  const [sortSuggestions, setSortSuggestions] = useState([]);

  // filter bar
  const [filterMode, setFilterMode] = useState('set');
  const [filterInputText, setFilterInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [showHelp, setShowHelp] = useState(false);
  const searchBarRef = useRef(null);

  // relic catalog
  const [allSets, setAllSets] = useState([]);
  const [allRelics, setAllRelics] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    setCatalogLoading(true);
    axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/relic-catalog/${selectedLoc}`)
      .then(res => {
        setAllSets(res.data.sets || []);
        setAllRelics(res.data.relics || []);
      })
      .catch(() => {
        setAllSets([]);
        setAllRelics([]);
      })
      .finally(() => setCatalogLoading(false));
  }, [selectedLoc]);

  function statLabel(statType) {
    if (!statType) return '';
    if (statType === 'CV') return 'CV';
    const t = statType.toLowerCase();
    if (t.includes("criticaldamage"))      return "CRIT DMG";
    if (t.includes("criticalchance"))      return "CRIT Rate";
    if (t.includes("attack"))              return "ATK";
    if (t.includes("break"))              return "Break";
    if (t.includes("defence"))            return "DEF";
    if (t.includes("fireaddedratio"))     return "Fire";
    if (t.includes("iceaddedratio"))      return "Ice";
    if (t.includes("imaginaryaddedratio")) return "Imaginary";
    if (t.includes("heal"))              return "Healing";
    if (t.includes("joy"))               return "Elation";
    if (t.includes("hp"))               return "HP";
    if (t.includes("physicaladdedratio")) return "Physical";
    if (t.includes("quantumaddedratio")) return "Quantum";
    if (t.includes("speed"))            return "SPD";
    if (t.includes("statusprobability")) return "Eff Hit";
    if (t.includes("statusresistance")) return "Eff RES";
    if (t.includes("thunderaddedratio")) return "Lightning";
    if (t.includes("windaddedratio"))   return "Wind";
    if (t.includes("sp"))              return "Energy";
    return statType;
  }

  function filterDisplayLabel() {
    if (!filter) return '';
    if (filter.field === 'type') return slotDisplayName(filter.value);
    return filter.displayLabel;
  }

  function handleStatClick(statType) {
    if (sortBy === statType) {
      if (sortOrder === 'DESC') {
        setSortOrder('ASC');
      } else {
        setSortBy('CV');
        setSortOrder('DESC');
      }
    } else {
      setSortBy(statType);
      setSortOrder('DESC');
    }
    setRelicPageNumber(1);
  }

  function handleFilterClick(field, value, displayLabel) {
    if (field === 'type') {
      if (typeFilter?.value === value) {
        setTypeFilter(null);
      } else {
        setTypeFilter({ value, displayLabel: slotDisplayName(value) });
      }
    } else {
      if (filter?.field === field && filter?.value === value) {
        setFilter(null);
      } else {
        const rarity = (field === 'tid' && value?.length >= 1) ? parseInt(value[0], 10) - 1 : undefined;
        setFilter({ field, value, displayLabel, rarity });
      }
    }
    setRelicPageNumber(1);
  }

  // --- sort bar sync ---
  useEffect(() => {
    if (sortInputFocused) return;
    setSortInputText(sortBy === 'CV' ? '' : statLabel(sortBy));
  }, [sortBy, sortInputFocused]);

  function updateSortSuggestions(text) {
    const q = text.trim().toLowerCase();
    if (!q) { setSortSuggestions([]); return; }
    setSortSuggestions(
      STAT_ALIASES
        .filter(entry => entry.labels.some(l => l.includes(q) || q.includes(l)))
        .slice(0, 8)
        .map(entry => ({ label: entry.display || entry.labels[0].toUpperCase(), type: entry.type }))
    );
  }

  function applySortSuggestion(s) {
    setSortBy(s.type); setSortOrder('DESC'); setRelicPageNumber(1);
    setSortSuggestions([]);
    setSortInputFocused(false);
  }

  function handleSortSubmit() {
    setSortInputFocused(false);
    if (sortSuggestions.length > 0) {
      applySortSuggestion(sortSuggestions[0]);
      return;
    }
    setSortSuggestions([]);
    const text = sortInputText.trim();
    if (!text) {
      setSortBy('CV'); setSortOrder('DESC'); setRelicPageNumber(1);
      return;
    }
    const statType = resolveStatType(text);
    if (statType) {
      setSortBy(statType); setSortOrder('DESC'); setRelicPageNumber(1);
    } else {
      setSortInputText(sortBy === 'CV' ? '' : statLabel(sortBy));
    }
  }

  // --- filter bar autocomplete ---
  function activeFilterMode() {
    return typeFilter ? 'set' : filterMode;
  }

  function updateSuggestions(text) {
    const q = text.trim();
    if (!q) { setSuggestions([]); return; }
    const mode = activeFilterMode();

    if (mode === 'set') {
      setSuggestions(
        allSets
          .filter(s => subsequenceMatch(q, s.name))
          .slice(0, 8)
          .map(s => ({ label: s.name, filter: { field: 'setId', value: s.setId, displayLabel: s.name } }))
      );
    } else if (mode === 'relic') {
      const matches = allRelics.filter(r => subsequenceMatch(q, r.name));
      const grouped = new Map();
      for (const r of matches) {
        const rarity = parseInt(r.tid[0], 10) - 1;
        if (!grouped.has(r.name)) grouped.set(r.name, []);
        grouped.get(r.name).push({ rarity, tid: r.tid });
      }
      const results = [];
      for (const [name, variants] of grouped) {
        variants.sort((a, b) => b.rarity - a.rarity);
        results.push({
          label: name,
          variants,
          selectedIdx: 0,
        });
        if (results.length >= 8) break;
      }
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }

  function shiftSuggestionRarity(idx, direction) {
    setSuggestions(prev => prev.map((s, i) => {
      if (i !== idx || !s.variants) return s;
      const newIdx = s.selectedIdx + direction;
      if (newIdx < 0 || newIdx >= s.variants.length) return s;
      return { ...s, selectedIdx: newIdx };
    }));
  }

  function handleFilterInputChange(e) {
    setFilterInputText(e.target.value);
    updateSuggestions(e.target.value);
  }

  function applySuggestion(suggestion) {
    const variant = suggestion.variants
      ? suggestion.variants[suggestion.selectedIdx]
      : null;
    const filterObj = variant
      ? { field: 'tid', value: variant.tid, displayLabel: suggestion.label, rarity: variant.rarity }
      : suggestion.filter;
    setFilter(filterObj);
    setRelicPageNumber(1);
    setSuggestions([]);
    setFilterInputText('');
  }

  function handleFilterSubmit() {
    if (suggestions.length > 0) {
      applySuggestion(suggestions[0]);
      return;
    }
    setSuggestions([]);
    const text = filterInputText.trim();
    if (!text) return;

    const mode = activeFilterMode();
    if (mode === 'set') {
      const match = allSets.find(s => s.name.toLowerCase() === text.toLowerCase())
        || allSets.find(s => subsequenceMatch(text, s.name));
      if (match) {
        setFilter({ field: 'setId', value: match.setId, displayLabel: match.name });
        setRelicPageNumber(1);
        setFilterInputText('');
      }
    } else if (mode === 'relic') {
      const match = allRelics.find(r => r.name.toLowerCase() === text.toLowerCase())
        || allRelics.find(r => subsequenceMatch(text, r.name));
      if (match) {
        setFilter({ field: 'tid', value: match.tid, displayLabel: match.name });
        setRelicPageNumber(1);
        setFilterInputText('');
      }
    }
  }

  function handleSlotClick(slot) {
    if (typeFilter?.value === slot.value) {
      setTypeFilter(null);
    } else {
      setTypeFilter({ value: slot.value, displayLabel: slot.label });
    }
    setRelicPageNumber(1);
  }

  function toggleFilterMode() {
    if (typeFilter) return;
    setFilterMode(prev => prev === 'set' ? 'relic' : 'set');
    setFilterInputText('');
    setSuggestions([]);
  }

  // --- data fetching ---
  function getRelicRangeLabel() {
    const start = (relicPageNumber - 1) * 20 + 1;
    if (!Array.isArray(relicsInfo)) return `Relics ${start}–${start + 19}`;
    if (relicsInfo.length === 0) return 'No relics';
    return `Relics ${start}–${start + relicsInfo.length - 1}`;
  }

  useEffect(() => {
    setRelicsInfo(null);
    const params = {};
    if (sortBy)      { params.sortBy = sortBy; params.order = sortOrder; }
    if (filter)      { params.filterField = filter.field; params.filterValue = filter.value; }
    if (typeFilter)  { params.typeFilter = typeFilter.value; }

    axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/relics/${uid}/${relicPageNumber}`, { params })
      .then((res) => {
        setRelicsInfo(res.data.relics);
        setHasMore(res.data.hasMore);
      })
      .catch((err) => {
        //console.log(err);
        setRelicsInfo("error");
        setHasMore(false);
      });
  }, [relicPageNumber, sortBy, filter, typeFilter, sortOrder, refreshKey]);

  useEffect(() => {
    const storedShowcaseStyle = localStorage.getItem("relicShowcaseStyle");
    if (storedShowcaseStyle === null) {
      localStorage.setItem("relicShowcaseStyle", JSON.stringify(true));
      setRelicShowcaseStyle(true);
    } else {
      setRelicShowcaseStyle(JSON.parse(storedShowcaseStyle));
    }
  }, []);

  const canGoPrev = relicPageNumber > 1;
  const canGoNext = hasMore;

  function handlePageChange(direction) {
    if (direction === -1 && canGoPrev) {
      setRelicPageNumber(relicPageNumber - 1);
    } else if (direction === 1 && canGoNext) {
      setRelicPageNumber(relicPageNumber + 1);
    }
  }

  function RelicSkeleton() {
    return (
      <div className="aspect-[3/2] rounded-lg border border-white/5 bg-gray-900/60 overflow-hidden flex p-1.5 gap-1.5 animate-pulse">
        <div className="w-[30%] bg-gray-800/60 rounded-md" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="bg-gray-800/60 rounded-md h-[30%]" />
          <div className="bg-gray-800/60 rounded-md flex-1" />
        </div>
        <div className="w-[3%] bg-gray-800/40 rounded-r-lg" />
      </div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      options={{ scrollbars: { autoHide: 'leave' } }}
      className="w-full h-full"
    >
      <div className='w-full px-4 py-2 sticky top-0 z-10'>
        <div className='w-full rounded-lg bg-gray-950/70 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between gap-2'>

          {/* left: pagination + range */}
          <div className='flex items-center gap-1.5'>
            <button onClick={() => handlePageChange(-1)}
              disabled={!canGoPrev}
              className={`text-xs p-1 rounded transition ${canGoPrev ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowLeft size={14} />
            </button>
            <span className='text-white afacad-bold text-xs tabular-nums min-w-[1.5rem] text-center select-none'>{relicPageNumber}</span>
            <button onClick={() => handlePageChange(1)}
              disabled={!canGoNext}
              className={`text-xs p-1 rounded transition ${canGoNext ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowRight size={14} />
            </button>
            <div className='w-px h-3 bg-white/10' />
            <span className='text-white/30 afacad-light text-xs'>{getRelicRangeLabel()}</span>
          </div>

          {/* right controls */}
          <div className='flex flex-wrap items-center gap-2'>

            {/* active filter chips */}
            {(filter || typeFilter) && (
              <div className='flex items-center gap-1'>
                {typeFilter && (
                  <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                    <span>{typeFilter.displayLabel}</span>
                    <button onClick={() => { setTypeFilter(null); setRelicPageNumber(1); }} className='hover:text-white transition'>×</button>
                  </div>
                )}
                {(filter && typeFilter) && (
                  <span className='text-white/20 text-[9px] afacad-light select-none'>+</span>
                )}
                {filter && (
                  <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                    <span>{filterDisplayLabel()}</span>
                    {filter.rarity != null && (
                      <span className={`text-[8px] ${filter.rarity >= 5 ? 'text-amber-400/60' : filter.rarity >= 4 ? 'text-purple-400/60' : filter.rarity >= 3 ? 'text-blue-400/60' : 'text-white/25'}`}>
                        {'★'.repeat(filter.rarity)}
                      </span>
                    )}
                    <button onClick={() => { setFilter(null); setRelicPageNumber(1); }} className='hover:text-white transition'>×</button>
                  </div>
                )}
              </div>
            )}

            {/* filter bar: set/relic search + type slot icons always visible */}
            <div ref={searchBarRef} className='relative flex items-center bg-gray-950/60 border border-white/10 rounded-md text-xs'>

              {/* set/relic search — locked to SET when typeFilter active */}
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={toggleFilterMode}
                className={`px-2 py-1 afacad-bold text-[10px] uppercase tracking-wider border-r border-white/10 shrink-0 select-none transition ${typeFilter ? 'text-white/25 cursor-default' : 'text-[var(--accent-muted)] hover:text-white cursor-pointer'}`}
                title={typeFilter ? 'Locked to SET while slot filter is active' : 'Toggle set/relic'}
              >
                {typeFilter ? 'set' : filterMode}
              </button>

              <div className='flex items-center gap-1 px-2 py-1'>
                <MdSearch size={12} className='text-white/25 shrink-0' />
                <input
                  className='afacad-light flex-1 min-w-0 bg-transparent outline-none text-white/70 placeholder-white/20 text-xs w-24'
                  value={filterInputText}
                  placeholder={(typeFilter ? 'set' : filterMode) === 'set' ? 'set name...' : 'relic name...'}
                  onChange={handleFilterInputChange}
                  onBlur={() => { setTimeout(() => { handleFilterSubmit(); }, 150); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') { setFilterInputText(''); setSuggestions([]); e.currentTarget.blur(); }
                  }}
                />
              </div>

              {/* autocomplete dropdown */}
              {suggestions.length > 0 && (
                <div className='absolute top-full left-0 mt-1 w-full bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden z-50 max-h-52 overflow-y-auto [scrollbar-width:thin]'>
                  {suggestions.map((s, i) => {
                    const variant = s.variants ? s.variants[s.selectedIdx] : null;
                    const rarity = variant ? variant.rarity : null;
                    const canUp = s.variants && s.selectedIdx > 0;
                    const canDown = s.variants && s.selectedIdx < s.variants.length - 1;

                    return (
                      <div
                        key={i}
                        className='px-3 py-1.5 text-xs afacad-light text-white/70 hover:bg-[var(--accent-bg-30)] hover:text-white cursor-pointer transition flex items-center gap-2'
                        onMouseDown={e => { e.preventDefault(); applySuggestion(s); }}
                      >
                        <span className='truncate flex-1'>{s.label}</span>
                        {rarity != null && (
                          <div className='flex items-center gap-1 shrink-0' onMouseDown={e => e.stopPropagation()}>
                            <button
                              className={`text-[10px] px-0.5 rounded transition ${canDown ? 'text-white/40 hover:text-white cursor-pointer' : 'text-white/10 cursor-default'}`}
                              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (canDown) shiftSuggestionRarity(i, 1); }}
                            >−</button>
                            <span className={`text-[9px] ${rarity >= 5 ? 'text-amber-400/70' : rarity >= 4 ? 'text-purple-400/70' : rarity >= 3 ? 'text-blue-400/70' : 'text-white/30'}`}>
                              {'★'.repeat(rarity)}
                            </span>
                            <button
                              className={`text-[10px] px-0.5 rounded transition ${canUp ? 'text-white/40 hover:text-white cursor-pointer' : 'text-white/10 cursor-default'}`}
                              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (canUp) shiftSuggestionRarity(i, -1); }}
                            >+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* divider */}
              <div className='w-px h-4 bg-white/10 shrink-0' />

              {/* type slot icons — always visible */}
              <div className='flex items-center gap-0.5 px-1.5 py-0.5'>
                {SLOT_OPTIONS.map(slot => (
                  <button
                    key={slot.value}
                    onClick={() => handleSlotClick(slot)}
                    className={`p-0.5 rounded transition cursor-pointer ${typeFilter?.value === slot.value ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-30)]' : 'hover:bg-white/10'}`}
                    title={filter ? `${slot.label} + ${filterDisplayLabel()}` : slot.label}
                  >
                    <img src={slot.icon} className='w-4 h-4 object-contain' />
                  </button>
                ))}
              </div>
            </div>

            {/* sort bar */}
            <div className='relative flex items-center gap-1 bg-gray-950/60 border border-white/10 rounded-md px-2 py-1 text-xs'>
              <span className='text-white/25 afacad-bold text-[10px] shrink-0'>SORT</span>
              <input
                className='afacad-light flex-1 min-w-0 bg-transparent outline-none text-white/70 placeholder-white/20 text-xs w-16'
                value={sortInputText}
                placeholder='CV'
                onChange={e => { setSortInputText(e.target.value); updateSortSuggestions(e.target.value); }}
                onFocus={() => setSortInputFocused(true)}
                onBlur={() => { setTimeout(() => { handleSortSubmit(); }, 150); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    setSortInputText(sortBy === 'CV' ? '' : statLabel(sortBy));
                    setSortSuggestions([]);
                    e.currentTarget.blur();
                  }
                }}
              />
              {sortBy && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setSortOrder(o => o === 'DESC' ? 'ASC' : 'DESC')}
                  className='text-[var(--accent-muted)] hover:text-white transition shrink-0 font-mono leading-none'
                  title={sortOrder}
                >
                  {sortOrder === 'DESC' ? '↓' : '↑'}
                </button>
              )}
              {sortBy !== 'CV' && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSortBy('CV'); setSortOrder('DESC'); setSortInputText(''); setSortSuggestions([]); }}
                  className='text-white/25 hover:text-white/60 transition shrink-0 leading-none'
                >
                  ×
                </button>
              )}

              {/* sort autocomplete dropdown */}
              {sortSuggestions.length > 0 && (
                <div className='absolute top-full left-0 mt-1 w-full bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden z-50 max-h-52 overflow-y-auto [scrollbar-width:thin]'>
                  {sortSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`px-3 py-1.5 text-xs afacad-light cursor-pointer transition truncate ${sortBy === s.type ? 'text-[var(--accent-muted)] bg-[var(--accent-bg-20)]' : 'text-white/70 hover:bg-[var(--accent-bg-30)] hover:text-white'}`}
                      onMouseDown={e => { e.preventDefault(); applySortSuggestion(s); }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help button */}
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowHelp(prev => !prev)}
              className={`transition cursor-pointer ${showHelp ? 'text-[var(--accent-muted)]' : 'text-white/25 hover:text-white/50'}`}
              title="Sort & filter help"
            >
              <IoHelpCircleOutline size={16} />
            </button>

            {showHelp && (
              <RelicFilterHelp
                anchorRef={searchBarRef}
                activeSort={sortBy}
                activeFilter={filter} activeTypeFilter={typeFilter}
                allSets={allSets}
                catalogLoading={catalogLoading}
                onSelectSort={(statType) => {
                  handleStatClick(statType);
                  setShowHelp(false);
                }}
                onSelectFilter={(filterObj) => {
                  handleFilterClick(filterObj.field, filterObj.value, filterObj.displayLabel);
                  setShowHelp(false);
                }}
                onClose={() => setShowHelp(false)}
              />
            )}

            {/* CV toggle */}
            <button
              title="Show CV"
              onClick={() => dispatch(toggleSetting('relicShowCV'))}
              className={`afacad-bold text-xs px-1.5 py-0.5 rounded transition ${showCV ? 'text-[var(--accent-muted)] bg-[var(--accent-bg-20)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              CV
            </button>
            {/* Two-column toggle — list only */}
            {!relicShowcaseStyle && (
              <button
                title="Two column"
                onClick={() => dispatch(toggleSetting('relicTwoColumn'))}
                className={`transition ${twoColumn ? 'text-[var(--accent-muted)]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <TbColumns2 size={16} />
              </button>
            )}
            <div className='w-px h-4 bg-white/15' />
            <FaList className={`${!relicShowcaseStyle ? "text-[var(--accent-muted)]" : "text-gray-500"} transition`} />
            <Switcher1 value={relicShowcaseStyle} setValue={setRelicShowcaseStyle} settingName="relicShowcaseStyle" />
            <BsFillGridFill className={`${relicShowcaseStyle ? "text-[var(--accent-muted)]" : "text-gray-500"} transition`} />
          </div>
        </div>
      </div>

      {/* relic grid */}
      {relicShowcaseStyle &&
        <div className="w-full p-4 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))' }}
        >
          {relicsInfo === null
            ? Array.from({ length: 18 }).map((_, i) => <RelicSkeleton key={i} />)
            : (relicsInfo === "error"
              ? <div className="col-span-full h-24 flex items-center justify-center backdrop-blur-md border border-red-500 rounded-2xl afacad-bold text-white [container-type:size] bg-black/70 overflow-clip">
                  <motion.img
                    src={loadFail}
                    alt='Failed to load relics'
                    className='w-full object-contain'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
              : relicsInfo.map((record, index) => (
                <div key={index} className="aspect-[3/2]">
                  <RelicItem info={record} relicIndex={(relicPageNumber - 1) * 20 + index + 1} onStatClick={handleStatClick} sortBy={sortBy} onFilterClick={handleFilterClick} activeFilter={filter} activeTypeFilter={typeFilter} />
                </div>
              ))
            )
          }
        </div>
      }

      {/* relic list */}
      {!relicShowcaseStyle &&
        <div className="w-full p-4">
          <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl p-3">
            {relicsInfo === null
              ? <div className="flex flex-col gap-2 animate-pulse">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-900/60 rounded-md border border-white/5" />
                  ))}
                </div>
              : relicsInfo === "error"
                ? <div className="h-24 flex items-center justify-center backdrop-blur-md border border-red-500 rounded-2xl afacad-bold text-white [container-type:size] bg-black/70 overflow-clip">
                    <motion.img
                      src={loadFail}
                      alt='Failed to load relics'
                      className='w-full object-contain'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                : <RelicList info={relicsInfo} relicPageNumber={relicPageNumber} twoColumn={twoColumn} showCV={showCV} cvShimmer={cvShimmer} onStatClick={handleStatClick} sortBy={sortBy} onFilterClick={handleFilterClick} activeFilter={filter} activeTypeFilter={typeFilter} />
            }
          </div>
        </div>
      }

    </OverlayScrollbarsComponent>
  );
}

export default DashboardsRelics;

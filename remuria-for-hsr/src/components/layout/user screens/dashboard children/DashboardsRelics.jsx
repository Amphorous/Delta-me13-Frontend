import axios from 'axios';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSetting, selectRelicTwoColumn, selectRelicShowCV, selectRelicCVShimmer } from '../../../../store/settingsSlice';
import RelicItem from './RelicItem';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdSearch } from "react-icons/md";
import { TbColumns2 } from "react-icons/tb";
import Switcher1 from '../../../Switcher1';
import { BsFillGridFill } from "react-icons/bs";
import { FaList } from "react-icons/fa6";
import RelicList from './RelicList';

const STAT_ALIASES = [
  { labels: ['cv'],                                              type: 'CV' },
  { labels: ['crit dmg', 'criticaldamage', 'cdmg', 'cd'],       type: 'CriticalDamageBase' },
  { labels: ['crit rate', 'criticalchance', 'crit'],             type: 'CriticalChanceBase' },
  { labels: ['atk', 'attack'],                                   type: 'AttackAddedRatio' },
  { labels: ['break', 'breakdamage'],                            type: 'BreakDamageAddedRatioBase' },
  { labels: ['def', 'defence', 'defense'],                       type: 'DefenceAddedRatio' },
  { labels: ['fire'],                                            type: 'FireAddedRatio' },
  { labels: ['ice'],                                             type: 'IceAddedRatio' },
  { labels: ['imaginary', 'img'],                                type: 'ImaginaryAddedRatio' },
  { labels: ['healing', 'heal'],                                 type: 'HealRatioBase' },
  { labels: ['elation', 'joy'],                                  type: 'Joy' },
  { labels: ['hp'],                                              type: 'MaxHP' },
  { labels: ['physical', 'phys'],                                type: 'PhysicalAddedRatio' },
  { labels: ['quantum', 'quant'],                                type: 'QuantumAddedRatio' },
  { labels: ['spd', 'speed'],                                    type: 'SpeedDelta' },
  { labels: ['eff hit', 'effhit', 'probability'],                type: 'StatusProbabilityBase' },
  { labels: ['eff res', 'effres', 'resistance'],                 type: 'StatusResistanceBase' },
  { labels: ['lightning', 'thunder'],                            type: 'ThunderAddedRatio' },
  { labels: ['wind'],                                            type: 'WindAddedRatio' },
  { labels: ['energy', 'sp ratio', 'spratio'],                   type: 'SPRatioBase' },
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

function DashboardsRelics() {

  const dispatch = useDispatch();
  const twoColumn = useSelector(selectRelicTwoColumn);
  const showCV = useSelector(selectRelicShowCV);
  const cvShimmer = useSelector(selectRelicCVShimmer);

  const [relicPageNumber, setRelicPageNumber] = useState(1);
  const [relicsInfo, setRelicsInfo] = useState(null);
  const [relicShowcaseStyle, setRelicShowcaseStyle] = useState(true);
  const uid = useLocation().pathname.split("/")[2];

  const [sortBy, setSortBy] = useState(null);
  const [filterBy, setFilterBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('DESC');

  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

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

  function handleStatClick(statType) {
    setFilterBy(null);
    if (sortBy === statType) {
      if (sortOrder === 'DESC') {
        setSortOrder('ASC');
      } else {
        setSortBy(null);
        setSortOrder('DESC');
      }
    } else {
      setSortBy(statType);
      setSortOrder('DESC');
    }
    setRelicPageNumber(1);
  }

  useEffect(() => {
    if (inputFocused) return;
    if (sortBy) setInputText(`sortBy:${statLabel(sortBy)}`);
    else if (filterBy) setInputText(`filterBy:${statLabel(filterBy)}`);
    else setInputText('');
  }, [sortBy, filterBy, inputFocused]);

  function handleInputSubmit() {
    setInputFocused(false);
    const text = inputText.trim();
    if (!text) {
      setSortBy(null); setFilterBy(null); setSortOrder('DESC'); setRelicPageNumber(1);
      return;
    }
    let mode = 'sortBy';
    let valueStr = text;
    if (/^sortby:/i.test(text))   { mode = 'sortBy';   valueStr = text.slice(7).trim(); }
    else if (/^filterby:/i.test(text)) { mode = 'filterBy'; valueStr = text.slice(9).trim(); }
    const statType = resolveStatType(valueStr);
    if (statType) {
      if (mode === 'sortBy')   { setSortBy(statType); setFilterBy(null); setSortOrder('DESC'); }
      else                     { setFilterBy(statType); setSortBy(null); }
      setRelicPageNumber(1);
    } else {
      // unrecognised — revert display to current state
      if (sortBy) setInputText(`sortBy:${statLabel(sortBy)}`);
      else if (filterBy) setInputText(`filterBy:${statLabel(filterBy)}`);
      else setInputText('');
    }
  }

  function getRelicRangeLabel() {
    const start = (relicPageNumber - 1) * 20 + 1;
    if (!Array.isArray(relicsInfo)) return `Relics ${start}–${start + 19}`;
    const count = relicsInfo.filter(r => r !== 'lastItem' && r !== 'error').length;
    if (count === 0) return 'No relics';
    return `Relics ${start}–${start + count - 1}`;
  }

  useEffect(() => {
    setRelicsInfo(null);
    const params = {};
    if (sortBy)   { params.sortBy = sortBy; params.order = sortOrder; }
    if (filterBy) { params.filterBy = filterBy; }

    axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/relics/${uid}/${relicPageNumber}`, { params })
      .then((res) => {
        setRelicsInfo([...res.data, "lastItem"]);
      })
      .catch((err) => {
        console.log(err);
        setRelicsInfo("error");
      });
  }, [relicPageNumber, sortBy, filterBy, sortOrder]);

  useEffect(() => {
    const storedShowcaseStyle = localStorage.getItem("relicShowcaseStyle");
    if (storedShowcaseStyle === null) {
      localStorage.setItem("relicShowcaseStyle", JSON.stringify(true));
      setRelicShowcaseStyle(true);
    } else {
      setRelicShowcaseStyle(JSON.parse(storedShowcaseStyle));
    }
  }, []);

  function handlePageChange(direction) {
    if (direction === -1 && relicPageNumber > 1) {
      setRelicPageNumber(relicPageNumber - 1);
    } else if (direction === 1 && relicsInfo !== null && relicsInfo[0] !== "lastItem") {
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
        <div className='w-full rounded-lg bg-gray-950/70 backdrop-blur-md px-4 py-2 flex items-center justify-center relative'>

          {/* range label — left */}
          <div className='absolute left-0 ml-4 pointer-events-none'>
            <span className='text-white/40 afacad-light text-xs'>{getRelicRangeLabel()}</span>
          </div>

          <div className='flex items-center gap-2'>
            <button onClick={() => handlePageChange(-1)}
              className='text-black afacad-bold text-sm px-2.5 py-1.5 rounded-full bg-white hover:bg-black/70 hover:text-white transition active:scale-95'>
              <MdKeyboardArrowLeft size={16} />
            </button>
            <div className='text-white afacad-bold text-sm min-w-[4rem] text-center'>Page {relicPageNumber}</div>
            <button onClick={() => handlePageChange(1)}
              className='text-black afacad-bold text-sm px-2.5 py-1.5 rounded-full bg-white hover:bg-black/70 hover:text-white transition active:scale-95'>
              <MdKeyboardArrowRight size={16} />
            </button>
          </div>

          <div className='absolute right-0 mr-4 flex items-center gap-2'>
            {/* Sort/filter searchbar — both modes */}
            <div className='flex items-center gap-1 bg-gray-950/60 border border-white/10 rounded-md px-2 py-1 text-xs min-w-36'>
              <MdSearch size={12} className='text-white/25 shrink-0' />
              <input
                className='afacad-light flex-1 min-w-0 bg-transparent outline-none text-white/70 placeholder-white/20 text-xs w-28'
                value={inputText}
                placeholder='sortBy: filterBy:'
                onChange={e => setInputText(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={handleInputSubmit}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    if (sortBy) setInputText(`sortBy:${statLabel(sortBy)}`);
                    else if (filterBy) setInputText(`filterBy:${statLabel(filterBy)}`);
                    else setInputText('');
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
              {(sortBy || filterBy) && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSortBy(null); setFilterBy(null); setSortOrder('DESC'); setInputText(''); }}
                  className='text-white/25 hover:text-white/60 transition shrink-0 leading-none'
                >
                  ×
                </button>
              )}
            </div>
            {/* CV toggle — both modes */}
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
            ? Array.from({ length: 6 }).map((_, i) => <RelicSkeleton key={i} />)
            : relicsInfo.map((record, index) => (
              relicsInfo[index] !== "lastItem" && (
                <div key={index} className="aspect-[3/2]">
                  {relicsInfo[index] === "error"
                    ? <div className="rounded-lg bg-red-900/40 border border-red-500/30 h-full flex items-center justify-center text-red-400 afacad-bold text-sm">Failed to load</div>
                    : <RelicItem info={relicsInfo[index]} relicIndex={(relicPageNumber - 1) * 20 + index + 1} onStatClick={handleStatClick} sortBy={sortBy} />
                  }
                </div>
              )
            ))
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
              : <RelicList info={relicsInfo} relicPageNumber={relicPageNumber} twoColumn={twoColumn} showCV={showCV} cvShimmer={cvShimmer} onStatClick={handleStatClick} sortBy={sortBy} />
            }
          </div>
        </div>
      }

    </OverlayScrollbarsComponent>
  );
}

export default DashboardsRelics;

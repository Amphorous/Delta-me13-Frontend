import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdCheck, MdClose, MdVisibility, MdVisibilityOff, MdEdit, MdAdd, MdDeleteOutline, MdErrorOutline, MdSearch } from 'react-icons/md';
import { IoHelpCircleOutline } from 'react-icons/io5';
import { CgSpinner } from 'react-icons/cg';
import BuildScrollList from './BuildScrollList';
import BuildDetailCard from './BuildDetailCard';
import BuildManageModal from './BuildManageModal';
import BuildFilterHelp from './BuildFilterHelp';
import { getBuilds, createBuild, renameBuild, deleteBuild, hideBuild } from '../../../../../utils/buildsApi';
import { getThemeBgColor } from '../../../../../utils/themeColors';
import { characterIconUrl, handleCharacterIconError, displayBuildName, MAX_BUILD_NAME_LENGTH, pathIconUrl, elementIconUrl, PATH_OPTIONS, ELEMENT_OPTIONS } from './buildConstants';
import { subsequenceMatch } from '../../../../../utils/fuzzyMatch';
import { resolveRubyText } from '../../../../../utils/hashTranslation';
import { toggleSetting, selectHideBuildIdentity, selectJpKanjiMode } from '../../../../../store/settingsSlice';
import { selectLoc } from '../../../../../store/localisationSlice';
import loadFail from '../../../../../assets/Loading Failed.png';

// Widths of the two Builds-tab panels — edit either independently to try different
// splits. Any leftover space between them (if the two don't add up to the full row)
// is just empty gap; `justify-between` below pins the strip left and the card right.
const DETAIL_CARD_WIDTH = '75%';

function DashboardBuilds() {
  const uid = useLocation().pathname.split("/")[2];
  const { refreshKey, bumpRefresh } = useOutletContext() || {};
  const dispatch = useDispatch();

  const bindings = useSelector(state => state.bindings);
  const hsrUids = Array.isArray(bindings?.hsr) ? bindings.hsr : [];
  const isOwnUid = hsrUids.includes(uid);
  const hideBuildIdentity = useSelector(selectHideBuildIdentity);
  const selectedLoc = useSelector(selectLoc);
  const jpKanjiMode = useSelector(selectJpKanjiMode);

  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('DESC');
  // filterByAvatarId is mutually exclusive with filterByPath/filterByElement (a
  // character has exactly one fixed path/element, so combining with it would be
  // redundant) — but path and element ARE combinable with each other (e.g. "Fire
  // AND Destruction"), so those two stay independent rather than one unified slot.
  const [filterByAvatarId, setFilterByAvatarId] = useState(null);
  const [filterByPath, setFilterByPath] = useState(null);
  const [filterByElement, setFilterByElement] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [buildsInfo, setBuildsInfo] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Path/element/character filter bar — mirrors DashboardsRelics.jsx's set/
  // relic search bar (mode toggle + fuzzy autocomplete + help panel). Path and
  // Element additionally get an always-visible icon row for one-click
  // selection, since (unlike relics' slot icons, which are a third thing
  // separate from its set/relic search) path/element ARE two of builds'
  // three searchable dimensions here — Character has no icon row (~200
  // characters is too many to show at once), it's search/help-panel only,
  // same as relics' set/relic modes.
  const [buildFilterMode, setBuildFilterMode] = useState('path'); // 'path' | 'element' | 'character'
  const [buildFilterInputText, setBuildFilterInputText] = useState('');
  const [buildFilterSuggestions, setBuildFilterSuggestions] = useState([]);
  const [showBuildFilterHelp, setShowBuildFilterHelp] = useState(false);
  const buildFilterBarRef = useRef(null);

  // Character-name catalog for fuzzy search — lets the user filter by a
  // character without already having a build record for them loaded, same
  // idea as DashboardsRelics.jsx's allSets/allRelics fetch, just against the
  // new avatar-catalog endpoint (mirrors relic-catalog: GET /hsr/avatar-catalog/
  // {locale} -> { avatars: [{avatarId, name}, ...] }).
  const [allAvatars, setAllAvatars] = useState([]);
  const [avatarCatalogLoading, setAvatarCatalogLoading] = useState(true);

  useEffect(() => {
    setAvatarCatalogLoading(true);
    axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/avatar-catalog/${selectedLoc}`)
      .then(res => setAllAvatars(res.data.avatars || []))
      .catch(() => setAllAvatars([]))
      .finally(() => setAvatarCatalogLoading(false));
  }, [selectedLoc]);

  // JP catalog names carry raw {RUBY_B#reading}kanji{RUBY_E#} markup (see
  // hashTranslation.js) — displayName reduces that down to just the kanji or
  // just the reading per the jpKanjiMode setting, exactly like
  // useTranslatedHash does for names shown elsewhere in the app. `name`
  // itself is deliberately left untouched: fuzzy search still matches against
  // the FULL raw string (reading + kanji + separators), not the reduced
  // display form, so toggling jpKanjiMode only changes what's shown, never
  // what's searchable.
  const avatarOptions = useMemo(
    () => allAvatars.map(a => ({
      ...a,
      displayName: selectedLoc === 'jp' ? resolveRubyText(a.name, jpKanjiMode) : a.name,
    })),
    [allAvatars, selectedLoc, jpKanjiMode]
  );

  const [focusedBuild, setFocusedBuild] = useState(null);
  const [mutatingState, setMutatingState] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  // Debounced focus: while the user flings through the scroll strip the focused
  // index rapid-fires, and re-rendering the detail card (cutin swap, gradient
  // extraction) for every intermediate character is wasted churn. Only commit a
  // focus to the card once it has held still for FOCUS_SETTLE_MS. useCallback
  // keeps the handler's identity stable so BuildScrollList's focus-report
  // effect doesn't re-fire (and restart the timer) on unrelated re-renders here.
  const FOCUS_SETTLE_MS = 200;
  const focusSettleTimer = useRef(null);
  const handleFocusChange = useCallback((build) => {
    if (focusSettleTimer.current) clearTimeout(focusSettleTimer.current);
    focusSettleTimer.current = setTimeout(() => setFocusedBuild(build), FOCUS_SETTLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(focusSettleTimer.current), []);

  const [renameTarget, setRenameTarget] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [createText, setCreateText] = useState('');
  // The build-name textbox lives permanently in the sort bar (see promptOpen
  // below) rather than mounting/unmounting, so autoFocus won't retrigger when
  // entering edit mode — focus it manually instead.
  const buildNameInputRef = useRef(null);

  // avatarId -> index into getSkinList(avatarInfo). Lives here (not in the scroll
  // item) so the strip icon and the detail card's icon/cutin stay in sync.
  const [skinSelections, setSkinSelections] = useState({});
  function cycleSkin(avatarId, skinCount) {
    if (!skinCount || skinCount < 2) return;
    setSkinSelections(prev => ({ ...prev, [avatarId]: ((prev[avatarId] ?? 0) + 1) % skinCount }));
  }

  async function loadBuilds() {
    setBuildsInfo(null);
    try {
      const data = await getBuilds(uid, page, { filterByAvatarId, filterByPath, filterByElement, order: sortOrder });
      setBuildsInfo(data.builds || []);
      setHasMore(!!data.hasMore);
    } catch {
      setBuildsInfo('error');
      setHasMore(false);
    }
  }

  useEffect(() => {
    loadBuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, page, sortOrder, filterByAvatarId, filterByPath, filterByElement, refreshKey]);

  const canGoPrev = page > 1;
  const canGoNext = hasMore;

  function handlePageChange(direction) {
    if (direction === -1 && canGoPrev) setPage(page - 1);
    else if (direction === 1 && canGoNext) setPage(page + 1);
  }

  // Same "N–M of this page" convention as DashboardsRelics' getRelicRangeLabel
  // — PAGE_LIMIT there and here are both 20 (see Celestia's FetchBuildService).
  function getBuildRangeLabel() {
    const start = (page - 1) * 20 + 1;
    if (!Array.isArray(buildsInfo)) return `Builds ${start}–${start + 19}`;
    if (buildsInfo.length === 0) return 'No builds';
    return `Builds ${start}–${start + buildsInfo.length - 1}`;
  }

  function handleCharacterFilterClick(avatarId) {
    setFilterByAvatarId(prev => prev === avatarId ? null : avatarId);
    setFilterByPath(null);
    setFilterByElement(null);
    setPage(1);
  }

  function handlePathFilterClick(path) {
    setFilterByPath(prev => prev === path ? null : path);
    setFilterByAvatarId(null);
    setPage(1);
  }

  function handleElementFilterClick(element) {
    setFilterByElement(prev => prev === element ? null : element);
    setFilterByAvatarId(null);
    setPage(1);
  }

  // --- build filter bar: mode toggle + fuzzy autocomplete (mirrors
  // DashboardsRelics.jsx's set/relic search, see the state comment above) ---
  // Suggestion shape is always { label, value, icon } regardless of mode, so
  // the dropdown/rendering code below doesn't need to special-case any of the
  // three modes — only how each mode's options get BUILT differs.
  // `searchText` is always the FULL, unreduced string to fuzzy-match against
  // (for character mode: the raw JP ruby markup and all — see the
  // avatarOptions comment above); `label` is what's actually rendered.
  // Path/Element don't have a reduced/raw distinction, so label doubles as
  // their own searchText.
  function buildFilterOptions() {
    if (buildFilterMode === 'character') {
      return avatarOptions.map(a => ({ label: a.displayName, searchText: a.name, value: a.avatarId, icon: characterIconUrl(a.avatarId) }));
    }
    const options = buildFilterMode === 'path' ? PATH_OPTIONS : ELEMENT_OPTIONS;
    return options.map(opt => ({ ...opt, searchText: opt.label }));
  }

  function updateBuildFilterSuggestions(text) {
    const q = text.trim();
    if (!q) { setBuildFilterSuggestions([]); return; }
    setBuildFilterSuggestions(buildFilterOptions().filter(opt => subsequenceMatch(q, opt.searchText)).slice(0, 8));
  }

  function handleBuildFilterInputChange(e) {
    setBuildFilterInputText(e.target.value);
    updateBuildFilterSuggestions(e.target.value);
  }

  function applyBuildFilterSuggestion(option) {
    if (buildFilterMode === 'path') handlePathFilterClick(option.value);
    else if (buildFilterMode === 'element') handleElementFilterClick(option.value);
    else handleCharacterFilterClick(option.value);
    setBuildFilterSuggestions([]);
    setBuildFilterInputText('');
  }

  function handleBuildFilterSubmit() {
    if (buildFilterSuggestions.length > 0) {
      applyBuildFilterSuggestion(buildFilterSuggestions[0]);
      return;
    }
    setBuildFilterSuggestions([]);
    const text = buildFilterInputText.trim();
    if (!text) return;
    const options = buildFilterOptions();
    const match = options.find(opt => opt.searchText.toLowerCase() === text.toLowerCase())
      || options.find(opt => subsequenceMatch(text, opt.searchText));
    if (match) applyBuildFilterSuggestion(match);
  }

  function toggleBuildFilterMode() {
    setBuildFilterMode(prev => prev === 'path' ? 'element' : prev === 'element' ? 'character' : 'path');
    setBuildFilterInputText('');
    setBuildFilterSuggestions([]);
  }

  async function runMutation(key, action, fn) {
    setMutatingState({ key, action });
    setMutationError(null);
    try {
      await fn();
      await loadBuilds();
      bumpRefresh?.();
    } catch {
      setMutationError(`Failed to ${action} build.`);
    } finally {
      setMutatingState(null);
    }
  }

  function handleRenameRequest(build) {
    setRenameTarget(build);
    setRenameText(displayBuildName(build.buildName) ?? '');
  }

  function confirmRename() {
    if (!renameTarget || !renameText.trim()) return;
    const target = renameTarget;
    setRenameTarget(null);
    runMutation(`${target.avatarId}:${target.buildName}`, 'rename', () =>
      renameBuild({ uid, avatarId: target.avatarId, buildNameOld: target.buildName, buildNameNew: renameText.trim() })
    );
  }

  function handleDeleteRequest(build) {
    if (!window.confirm(`Delete build "${displayBuildName(build.buildName) ?? 'this build'}"? This cannot be undone.`)) return;
    runMutation(`${build.avatarId}:${build.buildName}`, 'delete', () =>
      deleteBuild({ uid, avatarId: build.avatarId, buildName: build.buildName })
    );
  }

  function handleHideRequest(build) {
    runMutation(`${build.avatarId}:${build.buildName}`, 'hide', () =>
      hideBuild({ uid, avatarId: build.avatarId, buildName: build.buildName, isStatic: build.isStatic, hide: !build.isHidden })
    );
  }

  function confirmCreate() {
    if (!focusedBuild || !createText.trim()) return;
    const avatarId = focusedBuild.avatarId;
    const name = createText.trim();
    setShowCreatePrompt(false);
    setCreateText('');
    runMutation(`${avatarId}:__create__`, 'create', () =>
      createBuild({ uid, avatarId, buildName: name })
    );
  }

  const promptOpen = !!renameTarget || showCreatePrompt;
  useEffect(() => { if (promptOpen) buildNameInputRef.current?.focus(); }, [promptOpen]);

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='w-full px-4 py-2 sticky top-0 z-10 shrink-0'>
        <div className='w-full rounded-lg bg-gray-950/70 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between gap-2'>

          {/* left: pagination + range */}
          <div className='flex items-center gap-1.5'>
            <button onClick={() => handlePageChange(-1)}
              disabled={!canGoPrev}
              className={`text-xs p-1 rounded transition ${canGoPrev ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowLeft size={14} />
            </button>
            <span className='text-white afacad-bold text-xs tabular-nums min-w-[1.5rem] text-center select-none'>
              {page}
            </span>
            <button onClick={() => handlePageChange(1)}
              disabled={!canGoNext}
              className={`text-xs p-1 rounded transition ${canGoNext ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowRight size={14} />
            </button>
            <div className='w-px h-3 bg-white/10' />
            <span className='text-white/30 afacad-light text-xs'>{getBuildRangeLabel()}</span>
          </div>

          {/* right controls — order: buildname/create/edit/delete, sort,
              filter chips/bar/help, manage, eye (name/UID showcase toggle).
              The TEMP overflow-mode dev toggle is tacked on at the very end
              since it's not part of the "real" nav bar and is slated for
              removal — see its own comment below. */}
          <div className='flex flex-wrap items-center gap-2'>

            {isOwnUid && focusedBuild && (
              <div className='flex items-center gap-1 bg-gray-950/60 border border-white/10 rounded-md px-1.5 py-1'>
                <input
                  ref={buildNameInputRef}
                  disabled={!promptOpen}
                  value={promptOpen ? (renameTarget ? renameText : createText) : (displayBuildName(focusedBuild.buildName) ?? '')}
                  maxLength={MAX_BUILD_NAME_LENGTH}
                  placeholder={focusedBuild.isStatic ? 'New build name…' : ''}
                  onChange={e => renameTarget ? setRenameText(e.target.value) : setCreateText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') renameTarget ? confirmRename() : confirmCreate();
                    if (e.key === 'Escape') { setRenameTarget(null); setShowCreatePrompt(false); }
                  }}
                  className={`text-xs afacad-light rounded px-1.5 py-0.5 w-36 transition focus:outline-none ${promptOpen ? 'bg-gray-900/80 text-white ring-1 ring-[var(--accent-ring)]' : 'bg-transparent text-gray-500 cursor-default'}`}
                />

                {promptOpen ? (
                  <>
                    <button
                      onClick={() => renameTarget ? confirmRename() : confirmCreate()}
                      className='text-[var(--accent-muted)] hover:text-white transition p-1 rounded'
                      title="Confirm"
                    >
                      <MdCheck size={14} />
                    </button>
                    <button
                      onClick={() => { setRenameTarget(null); setShowCreatePrompt(false); }}
                      className='text-gray-500 hover:text-gray-300 transition p-1 rounded'
                      title="Cancel"
                    >
                      <MdClose size={14} />
                    </button>
                  </>
                ) : focusedBuild.isStatic ? (
                  <button
                    onClick={() => { setShowCreatePrompt(true); setCreateText(''); }}
                    className='afacad-bold text-xs px-1.5 py-0.5 rounded transition text-gray-500 hover:text-gray-300 flex items-center gap-1'
                    title="Create a new named build for this character"
                  >
                    <MdAdd size={12} />
                    New Build
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleRenameRequest(focusedBuild)}
                      className='afacad-bold text-xs px-1.5 py-0.5 rounded transition text-gray-500 hover:text-gray-300 flex items-center gap-1'
                      title="Edit this build's name"
                    >
                      <MdEdit size={12} />
                      Edit Build
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(focusedBuild)}
                      className='afacad-bold text-xs px-1.5 py-0.5 rounded transition text-red-500/70 hover:text-red-400 flex items-center gap-1'
                      title="Delete this build"
                    >
                      <MdDeleteOutline size={12} />
                      Delete Build
                    </button>
                  </>
                )}
              </div>
            )}

            <div className='flex items-center gap-1 bg-gray-950/60 border border-white/10 rounded-md px-2 py-1 text-xs'>
              <span className='text-white/25 afacad-bold text-[10px] shrink-0'>SORT CV</span>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => setSortOrder(o => o === 'DESC' ? 'ASC' : 'DESC')}
                className='text-[var(--accent-muted)] hover:text-white transition shrink-0 font-mono leading-none'
                title={sortOrder}
              >
                {sortOrder === 'DESC' ? '↓' : '↑'}
              </button>
            </div>

            {(filterByAvatarId || filterByPath || filterByElement) && (
              <div className='flex items-center gap-1'>
                {filterByAvatarId && (
                  <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                    <img src={characterIconUrl(filterByAvatarId)} alt="" className='w-4 h-4 rounded-full object-cover' onError={handleCharacterIconError} />
                    <button onClick={() => setFilterByAvatarId(null)} className='hover:text-white transition'>×</button>
                  </div>
                )}
                {filterByPath && (
                  <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                    <img src={pathIconUrl(filterByPath)} alt="" className='w-4 h-4 object-contain' />
                    <span>{PATH_OPTIONS.find(opt => opt.value === filterByPath)?.label ?? filterByPath}</span>
                    <button onClick={() => setFilterByPath(null)} className='hover:text-white transition'>×</button>
                  </div>
                )}
                {(filterByPath && filterByElement) && (
                  <span className='text-white/20 text-[9px] afacad-light select-none'>+</span>
                )}
                {filterByElement && (
                  <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                    <img src={elementIconUrl(filterByElement)} alt="" className='w-4 h-4 object-contain' />
                    <span>{filterByElement}</span>
                    <button onClick={() => setFilterByElement(null)} className='hover:text-white transition'>×</button>
                  </div>
                )}
              </div>
            )}

            {/* path/element/character filter bar: mode toggle + search, plus
                an always-visible icon row for path/element (see the
                buildFilterMode state comment above) */}
            <div ref={buildFilterBarRef} className='relative flex items-center bg-gray-950/60 border border-white/10 rounded-md text-xs'>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={toggleBuildFilterMode}
                className='px-2 py-1 afacad-bold text-[10px] uppercase tracking-wider border-r border-white/10 shrink-0 select-none transition text-[var(--accent-muted)] hover:text-white cursor-pointer'
                title="Toggle path/element/character"
              >
                {buildFilterMode}
              </button>

              <div className='flex items-center gap-1 px-2 py-1'>
                <MdSearch size={12} className='text-white/25 shrink-0' />
                <input
                  className='afacad-light flex-1 min-w-0 bg-transparent outline-none text-white/70 placeholder-white/20 text-xs w-24'
                  value={buildFilterInputText}
                  placeholder={buildFilterMode === 'path' ? 'path name...' : buildFilterMode === 'element' ? 'element name...' : 'character name...'}
                  onChange={handleBuildFilterInputChange}
                  onBlur={() => { setTimeout(() => { handleBuildFilterSubmit(); }, 150); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') { setBuildFilterInputText(''); setBuildFilterSuggestions([]); e.currentTarget.blur(); }
                  }}
                />
              </div>

              {buildFilterSuggestions.length > 0 && (
                <div className='absolute top-full left-0 mt-1 w-full bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden z-50 max-h-52 overflow-y-auto [scrollbar-width:thin]'>
                  {buildFilterSuggestions.map(opt => (
                    <div
                      key={opt.value}
                      className='px-3 py-1.5 text-xs afacad-light text-white/70 hover:bg-[var(--accent-bg-30)] hover:text-white cursor-pointer transition flex items-center gap-2'
                      onMouseDown={e => { e.preventDefault(); applyBuildFilterSuggestion(opt); }}
                    >
                      <img
                        src={opt.icon} alt=""
                        className={`w-3.5 h-3.5 shrink-0 ${buildFilterMode === 'character' ? 'rounded-full object-cover' : 'object-contain'}`}
                        onError={buildFilterMode === 'character' ? handleCharacterIconError : undefined}
                      />
                      <span className='truncate flex-1'>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {buildFilterMode !== 'character' && (
                <>
                  <div className='w-px h-4 bg-white/10 shrink-0' />

                  <div className='flex items-center gap-0.5 px-1.5 py-0.5'>
                    {(buildFilterMode === 'path' ? PATH_OPTIONS : ELEMENT_OPTIONS).map(opt => {
                      const active = buildFilterMode === 'path' ? filterByPath === opt.value : filterByElement === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => buildFilterMode === 'path' ? handlePathFilterClick(opt.value) : handleElementFilterClick(opt.value)}
                          className={`p-0.5 rounded transition cursor-pointer ${active ? 'bg-[var(--accent-bg-40)] ring-1 ring-[var(--accent-border-30)]' : 'hover:bg-white/10'}`}
                          title={opt.label}
                        >
                          <img src={opt.icon} alt="" className='w-4 h-4 object-contain' />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowBuildFilterHelp(prev => !prev)}
              className={`transition cursor-pointer ${showBuildFilterHelp ? 'text-[var(--accent-muted)]' : 'text-white/25 hover:text-white/50'}`}
              title="Path/element/character filter help"
            >
              <IoHelpCircleOutline size={16} />
            </button>

            {showBuildFilterHelp && (
              <BuildFilterHelp
                anchorRef={buildFilterBarRef}
                activeFilterByPath={filterByPath}
                activeFilterByElement={filterByElement}
                activeFilterByAvatarId={filterByAvatarId}
                allAvatars={avatarOptions}
                catalogLoading={avatarCatalogLoading}
                onSelectPath={(value) => { handlePathFilterClick(value); setShowBuildFilterHelp(false); }}
                onSelectElement={(value) => { handleElementFilterClick(value); setShowBuildFilterHelp(false); }}
                onSelectCharacter={(avatarId) => { handleCharacterFilterClick(avatarId); setShowBuildFilterHelp(false); }}
                onClose={() => setShowBuildFilterHelp(false)}
              />
            )}

            {isOwnUid && (
              <button
                onClick={() => setShowManageModal(true)}
                className='afacad-bold text-xs px-1.5 py-0.5 rounded transition text-gray-500 hover:text-gray-300 flex items-center gap-1'
                title="Manage builds (rename, delete, hide)"
              >
                <MdEdit size={12} />
                Manage
              </button>
            )}

            <button
              onClick={() => dispatch(toggleSetting('hideBuildIdentity'))}
              className={`p-1 rounded transition ${hideBuildIdentity ? 'text-[var(--accent-muted)] bg-[var(--accent-bg-20)]' : 'text-gray-500 hover:text-gray-300'}`}
              title={hideBuildIdentity ? 'Show name & UID on build detail card' : 'Hide name & UID on build detail card'}
            >
              {hideBuildIdentity ? <MdVisibilityOff size={14} /> : <MdVisibility size={14} />}
            </button>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {mutationError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className='w-full px-4 pb-2 shrink-0'
          >
            <div className='w-full flex items-center gap-2 bg-red-950/40 backdrop-blur-md border border-red-500/30 rounded-lg px-3 py-2'>
              <MdErrorOutline className='text-red-400 shrink-0' size={16} />
              <span className='flex-1 min-w-0 text-red-200 afacad-light text-xs'>{mutationError}</span>
              <button
                onClick={() => setMutationError(null)}
                className='text-red-400/70 hover:text-red-300 transition p-0.5 rounded shrink-0'
              >
                <MdClose size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='flex-1 min-h-0 px-4 pb-4'>
        {buildsInfo === null ? (
          <div
            className='w-full h-full flex items-center justify-center backdrop-blur-md border
             border-[var(--accent-border-30)] rounded-2xl afacad-bold
              text-white [container-type:size]'
            style={{ backgroundColor: getThemeBgColor({ darkness: 25, alpha: 75 }) }}
          >
            <p className='text-[4cqw] mr-[0.5cqw]'>Loading Builds</p>
            <CgSpinner className='text-[4cqw] animate-spin' />
          </div>
        ) : buildsInfo === 'error' ? (
          <div
            className='w-full h-full flex items-center justify-center backdrop-blur-md border
             border-red-500 rounded-2xl afacad-bold
              text-white [container-type:size] bg-black/70 overflow-clip'
          >
            <motion.img
              src={loadFail}
              alt='Failed to load builds'
              className='w-full object-contain'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            />
          </div>
        ) : (
          

          <div className='flex flex-row w-full h-full justify-between'>
            {/* -ml-8 cancels the ambient px-4 from both Dashboard.jsx and this tab's
                own content padding, so the strip's left edge sits flush against the
                true window border (the "chord" the arc curve is drawn against). */}
            <div className='bg-amdber-400 shrink-0 h-full w-[20%] min-w-[399px] -ml-10 ' 
            >
              <BuildScrollList
                builds={buildsInfo}
                onFocusChange={handleFocusChange}
                onCharacterFilterClick={handleCharacterFilterClick}
                skinSelections={skinSelections}
                onCycleSkin={cycleSkin}
              />
            </div>
            <div className='shrink-0 h-full' style={{ width: DETAIL_CARD_WIDTH }}>
              <BuildDetailCard
                build={focusedBuild}
                isOwnUid={isOwnUid}
                onRename={handleRenameRequest}
                onDelete={handleDeleteRequest}
                onHide={handleHideRequest}
                onCreate={() => { setShowCreatePrompt(true); setCreateText(''); }}
                mutating={mutatingState}
                skinIndex={skinSelections[focusedBuild?.avatarId] ?? 0}
                onPathFilterClick={handlePathFilterClick}
                onElementFilterClick={handleElementFilterClick}
              />
            </div>
          </div>

        )}
      </div>

      {showManageModal && (
        <BuildManageModal
          uid={uid}
          onClose={() => setShowManageModal(false)}
          onMutated={() => { loadBuilds(); bumpRefresh?.(); }}
        />
      )}
    </div>
  );
}

export default DashboardBuilds;

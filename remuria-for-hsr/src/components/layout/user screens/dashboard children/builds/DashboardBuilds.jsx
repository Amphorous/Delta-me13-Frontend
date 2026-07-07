import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router';
import { useSelector } from 'react-redux';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdCheck, MdClose } from 'react-icons/md';
import { CgSpinner } from 'react-icons/cg';
import BuildScrollList from './BuildScrollList';
import BuildDetailCard from './BuildDetailCard';
import { getBuilds, getAllBuilds, createBuild, renameBuild, deleteBuild, hideBuild } from '../../../../../utils/buildsApi';
import { getThemeBgColor } from '../../../../../utils/themeColors';
import { characterIconUrl, displayBuildName } from './buildConstants';
import loadFail from '../../../../../assets/Loading Failed.png';

// Widths of the two Builds-tab panels — edit either independently to try different
// splits. Any leftover space between them (if the two don't add up to the full row)
// is just empty gap; `justify-between` below pins the strip left and the card right.
const SCROLL_STRIP_WIDTH = '18%';
const DETAIL_CARD_WIDTH = '75%';

function applyClientFilterSort(list, filterByAvatarId, order) {
  let result = list;
  if (filterByAvatarId) result = result.filter(b => b.avatarId === filterByAvatarId);
  result = [...result].sort((a, b) => order === 'ASC' ? (a.cv ?? 0) - (b.cv ?? 0) : (b.cv ?? 0) - (a.cv ?? 0));
  return result;
}

function DashboardBuilds() {
  const uid = useLocation().pathname.split("/")[2];
  const { refreshKey, bumpRefresh } = useOutletContext() || {};

  const bindings = useSelector(state => state.bindings);
  const hsrUids = Array.isArray(bindings?.hsr) ? bindings.hsr : [];
  const isOwnUid = hsrUids.includes(uid);

  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterByAvatarId, setFilterByAvatarId] = useState(null);
  const [manageMode, setManageMode] = useState(false);
  const [buildsInfo, setBuildsInfo] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [focusedBuild, setFocusedBuild] = useState(null);
  const [mutatingState, setMutatingState] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const [renameTarget, setRenameTarget] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [createText, setCreateText] = useState('');

  async function loadBuilds() {
    setBuildsInfo(null);
    try {
      if (manageMode && isOwnUid) {
        const data = await getAllBuilds(uid);
        setBuildsInfo(applyClientFilterSort(Array.isArray(data) ? data : [], filterByAvatarId, sortOrder));
        setHasMore(false);
      } else {
        const data = await getBuilds(uid, page, { filterByAvatarId, order: sortOrder });
        setBuildsInfo(data.builds || []);
        setHasMore(!!data.hasMore);
      }
    } catch {
      setBuildsInfo('error');
      setHasMore(false);
    }
  }

  useEffect(() => {
    loadBuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, page, sortOrder, filterByAvatarId, refreshKey, manageMode, isOwnUid]);

  const canGoPrev = !manageMode && page > 1;
  const canGoNext = !manageMode && hasMore;

  function handlePageChange(direction) {
    if (direction === -1 && canGoPrev) setPage(page - 1);
    else if (direction === 1 && canGoNext) setPage(page + 1);
  }

  function handleCharacterFilterClick(avatarId) {
    setFilterByAvatarId(prev => prev === avatarId ? null : avatarId);
    setPage(1);
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

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='w-full px-4 py-2 sticky top-0 z-10 shrink-0'>
        <div className='w-full rounded-lg bg-gray-950/70 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between gap-2'>

          {/* left: pagination */}
          <div className='flex items-center gap-1.5'>
            <button onClick={() => handlePageChange(-1)}
              disabled={!canGoPrev}
              className={`text-xs p-1 rounded transition ${canGoPrev ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowLeft size={14} />
            </button>
            <span className='text-white afacad-bold text-xs tabular-nums min-w-[1.5rem] text-center select-none'>
              {manageMode ? 'All' : page}
            </span>
            <button onClick={() => handlePageChange(1)}
              disabled={!canGoNext}
              className={`text-xs p-1 rounded transition ${canGoNext ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer' : 'text-white/15 cursor-not-allowed'}`}>
              <MdKeyboardArrowRight size={14} />
            </button>
          </div>

          {/* right controls */}
          <div className='flex flex-wrap items-center gap-2'>

            {filterByAvatarId && (
              <div className='flex items-center gap-1 bg-[var(--accent-bg-30)] border border-[var(--accent-border-30)] rounded-md px-1.5 py-0.5 text-[var(--accent-muted)] text-xs afacad-light'>
                <img src={characterIconUrl(filterByAvatarId)} alt="" className='w-4 h-4 rounded-full object-cover' onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                <button onClick={() => setFilterByAvatarId(null)} className='hover:text-white transition'>×</button>
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

            {isOwnUid && (
              <button
                onClick={() => setManageMode(m => !m)}
                className={`afacad-bold text-xs px-1.5 py-0.5 rounded transition ${manageMode ? 'text-[var(--accent-muted)] bg-[var(--accent-bg-20)]' : 'text-gray-500 hover:text-gray-300'}`}
                title="Toggle manage mode (shows hidden builds)"
              >
                Manage
              </button>
            )}

          </div>
        </div>
      </div>

      {promptOpen && (
        <div className='w-full px-4 pb-2 shrink-0'>
          <div className='w-full flex items-center gap-2'>
            <span>
              {renameTarget ? 'Rename build:' : `New build for ${focusedBuild ? (displayBuildName(focusedBuild.buildName) ?? 'character') : ''}:`}
            </span>
            <input
              autoFocus
              className='flex-1 min-w-0'
              value={renameTarget ? renameText : createText}
              onChange={e => renameTarget ? setRenameText(e.target.value) : setCreateText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') renameTarget ? confirmRename() : confirmCreate();
                if (e.key === 'Escape') { setRenameTarget(null); setShowCreatePrompt(false); }
              }}
            />
            <button onClick={() => renameTarget ? confirmRename() : confirmCreate()}>
              <MdCheck />
            </button>
            <button onClick={() => { setRenameTarget(null); setShowCreatePrompt(false); }}>
              <MdClose />
            </button>
          </div>
        </div>
      )}

      {mutationError && (
        <div className='w-full px-4 pb-2 shrink-0'>
          <div className='w-full flex items-center justify-between'>
            <span>{mutationError}</span>
            <button onClick={() => setMutationError(null)}>×</button>
          </div>
        </div>
      )}

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
            <div className='bg-amber-400 shrink-0 h-full -ml-8 ' 
             style={{ width: SCROLL_STRIP_WIDTH }}
            >
              <BuildScrollList
                builds={buildsInfo}
                onFocusChange={(build) => setFocusedBuild(build)}
                onCharacterFilterClick={handleCharacterFilterClick}
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
              />
            </div>
          </div>

        )}
      </div>
    </div>
  );
}

export default DashboardBuilds;

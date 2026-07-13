import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdCheck, MdClose, MdVisibility, MdVisibilityOff, MdEdit, MdAdd, MdDeleteOutline } from 'react-icons/md';
import { CgSpinner } from 'react-icons/cg';
import BuildScrollList from './BuildScrollList';
import BuildDetailCard from './BuildDetailCard';
import BuildManageModal from './BuildManageModal';
import { getBuilds, createBuild, renameBuild, deleteBuild, hideBuild } from '../../../../../utils/buildsApi';
import { getThemeBgColor } from '../../../../../utils/themeColors';
import { characterIconUrl, handleCharacterIconError, displayBuildName, MAX_BUILD_NAME_LENGTH } from './buildConstants';
import { toggleSetting, selectHideBuildIdentity } from '../../../../../store/settingsSlice';
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

  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterByAvatarId, setFilterByAvatarId] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [buildsInfo, setBuildsInfo] = useState(null);
  const [hasMore, setHasMore] = useState(false);

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
      const data = await getBuilds(uid, page, { filterByAvatarId, order: sortOrder });
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
  }, [uid, page, sortOrder, filterByAvatarId, refreshKey]);

  const canGoPrev = page > 1;
  const canGoNext = hasMore;

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
  useEffect(() => { if (promptOpen) buildNameInputRef.current?.focus(); }, [promptOpen]);

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
              {page}
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
                <img src={characterIconUrl(filterByAvatarId)} alt="" className='w-4 h-4 rounded-full object-cover' onError={handleCharacterIconError} />
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

            <button
              onClick={() => dispatch(toggleSetting('hideBuildIdentity'))}
              className={`p-1 rounded transition ${hideBuildIdentity ? 'text-[var(--accent-muted)] bg-[var(--accent-bg-20)]' : 'text-gray-500 hover:text-gray-300'}`}
              title={hideBuildIdentity ? 'Show name & UID on build detail card' : 'Hide name & UID on build detail card'}
            >
              {hideBuildIdentity ? <MdVisibilityOff size={14} /> : <MdVisibility size={14} />}
            </button>

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

          </div>
        </div>
      </div>

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

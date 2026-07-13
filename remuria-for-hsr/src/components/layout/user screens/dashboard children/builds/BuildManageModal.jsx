import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdEdit, MdDeleteOutline, MdVisibility, MdVisibilityOff, MdCheck } from 'react-icons/md';
import { getAllBuilds, renameBuild, deleteBuild, hideBuild } from '../../../../../utils/buildsApi';
import { useTranslatedHash } from '../../../../../utils/hashTranslation';
import { characterIconUrl, handleCharacterIconError, displayBuildName, MAX_BUILD_NAME_LENGTH } from './buildConstants';

// One row: character face + name (buildName, or the character's own name for
// unnamed/static builds), with inline rename/hide/delete — no navigation away
// from the modal, everything happens in place.
function ManageRow({ uid, build, onMutated }) {
  const avatarName = useTranslatedHash(build.avatarInfo?.AvatarNameHash);
  // Static builds can never carry a real buildName (editBuildName only ever
  // matches isStatic: false), so they always show the character's own name —
  // 'Loading…' is just the brief gap before the hash translation resolves.
  const label = build.isStatic ? (avatarName || 'Loading…') : (displayBuildName(build.buildName) ?? avatarName);

  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [busyAction, setBusyAction] = useState(null); // 'rename' | 'delete' | 'hide'
  const [error, setError] = useState(null);

  function startRename() {
    setRenameText(displayBuildName(build.buildName) ?? '');
    setError(null);
    setRenaming(true);
  }

  async function confirmRename() {
    if (!renameText.trim()) return;
    setBusyAction('rename');
    setError(null);
    try {
      await renameBuild({ uid, avatarId: build.avatarId, buildNameOld: build.buildName, buildNameNew: renameText.trim() });
      setRenaming(false);
      onMutated();
    } catch {
      setError('Rename failed');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete build "${label}"? This cannot be undone.`)) return;
    setBusyAction('delete');
    setError(null);
    try {
      await deleteBuild({ uid, avatarId: build.avatarId, buildName: build.buildName });
      onMutated();
    } catch {
      setError('Delete failed');
      setBusyAction(null);
    }
  }

  async function handleHide() {
    setBusyAction('hide');
    setError(null);
    try {
      await hideBuild({ uid, avatarId: build.avatarId, buildName: build.buildName, isStatic: build.isStatic, hide: !build.isHidden });
      onMutated();
    } catch {
      setError('Hide failed');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5 ${build.isHidden ? 'opacity-50' : ''}`}>
      <img
        src={characterIconUrl(build.avatarId)}
        alt=""
        className='w-9 h-9 rounded-full object-cover shrink-0'
        onError={handleCharacterIconError}
      />

      {renaming ? (
        <input
          autoFocus
          value={renameText}
          maxLength={MAX_BUILD_NAME_LENGTH}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
          className='flex-1 min-w-0 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white afacad-light focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]'
        />
      ) : (
        <span className='flex-1 min-w-0 flex items-center gap-1.5'>
          <span className='truncate text-sm text-white afacad-semi-bold'>{label}</span>
          {build.isStatic && (
            <span className='shrink-0 bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full afacad-bold'>
              CURRENT
            </span>
          )}
        </span>
      )}

      {error && <span className='text-red-400 afacad-light text-xs shrink-0'>{error}</span>}

      <div className='flex items-center gap-1 shrink-0'>
        {renaming ? (
          <>
            <button
              onClick={confirmRename}
              disabled={busyAction === 'rename'}
              className='p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <MdCheck size={16} />
            </button>
            <button
              onClick={() => setRenaming(false)}
              className='p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer'
            >
              <MdClose size={16} />
            </button>
          </>
        ) : (
          !build.isStatic && (
            <button
              onClick={startRename}
              title="Rename"
              className='p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer'
            >
              <MdEdit size={16} />
            </button>
          )
        )}

        <button
          onClick={handleHide}
          disabled={busyAction === 'hide'}
          title={build.isHidden ? 'Unhide' : 'Hide'}
          className='p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
        >
          {build.isHidden ? <MdVisibility size={16} /> : <MdVisibilityOff size={16} />}
        </button>

        {!build.isStatic && (
          <button
            onClick={handleDelete}
            disabled={busyAction === 'delete'}
            title="Delete"
            className='p-1.5 rounded text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <MdDeleteOutline size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// A minimal-representation list pop-in for bulk build management — replaces
// repurposing the main scroll/detail view for this (which used to swap the
// paginated list for an unpaginated "all builds" one via manageMode). This is
// a self-contained modal: it fetches its own full build list (including hidden
// ones, since getAllBuilds doesn't filter those out) and calls onMutated after
// every successful rename/delete/hide so the caller can refresh whatever else
// depends on build state (the main scroll strip, cross-tab refresh key, ...).
function BuildManageModal({ uid, onClose, onMutated }) {
  const [builds, setBuilds] = useState(null); // null = loading, 'error', or array

  async function load() {
    setBuilds(null);
    try {
      const data = await getAllBuilds(uid);
      setBuilds(Array.isArray(data) ? data : []);
    } catch {
      setBuilds('error');
    }
  }

  useEffect(() => { load(); }, [uid]);

  function handleMutated() {
    load();
    onMutated?.();
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className='w-full max-w-xl max-h-[80vh] flex flex-col bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden'
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className='flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0'>
            <span className='text-white afacad-bold text-lg'>Manage Builds</span>
            <button onClick={onClose} className='text-white/50 hover:text-white transition cursor-pointer'>
              <MdClose size={20} />
            </button>
          </div>

          <div className='flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full'>
            {builds === null ? (
              <div className='flex items-center justify-center h-32 text-white/50 afacad-light text-sm'>Loading…</div>
            ) : builds === 'error' ? (
              <div className='flex items-center justify-center h-32 text-red-400 afacad-light text-sm'>Failed to load builds</div>
            ) : builds.length === 0 ? (
              <div className='flex items-center justify-center h-32 text-white/50 afacad-light text-sm'>No builds found.</div>
            ) : (
              <div className='flex flex-col gap-0.5'>
                {builds.map((build) => (
                  <ManageRow
                    key={`${build.avatarId}:${build.buildName}:${build.isStatic}`}
                    uid={uid}
                    build={build}
                    onMutated={handleMutated}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default BuildManageModal;

import { motion, AnimatePresence } from 'framer-motion';
import { MdErrorOutline, MdWarningAmber, MdClose } from 'react-icons/md';

// Dismissible status banner for the user-refresh (upsert) flow — shown when a
// refresh hard-fails (type 'error', red) or partially succeeds because some
// characters use game assets the backend doesn't support yet (type 'warning',
// amber). Same glassmorphic banner pattern as DashboardBuilds' mutationError.
// `warning` is { type: 'warning' | 'error', text } or null/undefined (hidden).
function RefreshWarningBanner({ warning, onDismiss }) {
  const isError = warning?.type === 'error';

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className='w-full'
        >
          <div className={`w-full flex items-center gap-2 backdrop-blur-md border rounded-lg px-3 py-2 ${isError ? 'bg-red-950/40 border-red-500/30' : 'bg-amber-950/40 border-amber-500/30'}`}>
            {isError
              ? <MdErrorOutline className='text-red-400 shrink-0' size={16} />
              : <MdWarningAmber className='text-amber-400 shrink-0' size={16} />}
            <span className={`flex-1 min-w-0 afacad-light text-xs ${isError ? 'text-red-200' : 'text-amber-200'}`}>
              {warning.text}
            </span>
            <button
              onClick={onDismiss}
              className={`transition p-0.5 rounded shrink-0 ${isError ? 'text-red-400/70 hover:text-red-300' : 'text-amber-400/70 hover:text-amber-300'}`}
            >
              <MdClose size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RefreshWarningBanner;

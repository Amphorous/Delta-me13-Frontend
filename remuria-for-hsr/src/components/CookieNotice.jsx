import { useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 're:muria:cookieNoticeDismissed';

function alreadyDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Shown once on first visit, dismissed permanently via localStorage. Not a
// consent gate (no accept/reject choice) since the app only sets strictly
// necessary session/CSRF cookies, which don't require opt-in consent under
// GDPR/ePrivacy — this is a plain informational notice.
//
// Deliberately no framer-motion/AnimatePresence here: ad blockers with a
// "block cookie consent notices" feature (Brave Shields has one on by
// default) detect and rip elements like this straight out of the DOM. If
// React still has an in-flight exit animation referencing that node when
// that happens, its next reconciliation can throw trying to touch a node
// that's already gone, which can take down the whole render tree. A plain
// conditional render has no such in-between state for that to happen to.
function CookieNotice() {
  const [dismissed, setDismissed] = useState(alreadyDismissed);

  if (dismissed) return null;

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable — notice just won't persist across reloads.
    }
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex justify-center px-2">
      <div className="max-w-2xl w-full bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="afacad-light text-white/85 text-sm flex-1">
          the only cookie we use is the xsrf, which is kinda mandatory for security,
          rest assured, this is a demo app which im running from my raspberry pi,
          and i have no use or need for your personal info.{' '}
          <Link to="/legal-notice" className="text-[var(--accent-muted)] underline hover:text-[var(--accent-solid)] transition">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={handleDismiss}
          className="afacad-semi-bold text-xs shrink-0 px-4 py-2 rounded-full bg-[var(--accent-bg-40)] border border-[var(--accent-border-60)] text-white hover:bg-[var(--accent-bg-60)] transition cursor-pointer select-none"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default CookieNotice;

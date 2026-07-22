import { Component } from 'react';

// Top-level safety net so a crash ANYWHERE (a third-party extension yanking
// a DOM node out from under React, or any future bug) shows a recoverable
// screen instead of a blank white page. React Router's own errorElement
// (see main.jsx) already catches render-phase errors thrown within a route's
// subtree, but DOM-mutation exceptions from browser extensions (e.g. Brave
// Shields' "block cookie consent notices" removing an element React still
// holds a reference to) happen during React's commit phase, not always
// render, and don't reliably propagate the same way — this catches those too,
// wrapping everything including the router itself.
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 p-6">
          <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-8 flex flex-col gap-4 text-center">
            <p className="libre-baskerville-bold text-white text-2xl">
              Something went wrong
            </p>
            <p className="afacad-light text-white/50 text-sm">
              This is sometimes caused by a browser extension (ad blockers in
              particular). Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2 rounded-xl afacad-semi-bold text-sm bg-[var(--accent-bg-40,rgba(255,255,255,0.1))] border border-white/10 text-white hover:bg-[var(--accent-bg-60,rgba(255,255,255,0.2))] transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;

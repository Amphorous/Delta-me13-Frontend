import { Component } from 'react';

// Wraps a single non-essential feature (one an ad blocker might target) so
// its failure to load or render never bubbles up past this point — it just
// renders nothing instead, leaving everything else (Header, Footer, the
// rest of the page) completely unaffected. Deliberately silent, no fallback
// UI: for something like a cookie notice, "it didn't show up" isn't worth
// telling the user about.
class SilentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('SilentErrorBoundary suppressed:', error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default SilentErrorBoundary;

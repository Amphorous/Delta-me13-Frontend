import { useDispatch, useSelector } from 'react-redux';
import RefreshWarningBanner from './RefreshWarningBanner';
import { selectTranslationWarning, setTranslationWarning } from '../store/translationWarningSlice';

// Global counterpart to RefreshWarningBanner's per-card usage — mounted once in
// RootLayout so it's visible regardless of which page/component happened to
// trigger the translate request that surfaced the Translator's "_warning".
function TranslationWarningBanner() {
  const dispatch = useDispatch();
  const text = useSelector(selectTranslationWarning);
  const warning = text ? { type: 'warning', text } : null;

  return (
    <div className="px-4 pt-2">
      <RefreshWarningBanner warning={warning} onDismiss={() => dispatch(setTranslationWarning(null))} />
    </div>
  );
}

export default TranslationWarningBanner;

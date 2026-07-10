import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectLoc } from '../store/localisationSlice';

// The translator returns this sentinel for hashes it has no textmap entry for (and
// for everything while its Redis is still warming up) — treat it as "no translation"
// rather than displaying it, and don't cache it so a later mount can retry.
const MISSING = 'Translation Missing';

// Some textmap strings carry game rendering tags (<unbreak>, <color=...>, ...) that
// mean nothing outside the game client — strip any <...> markup, keep the text.
function stripRenderTags(value) {
  return value.replace(/<[^>]*>/g, '').trim();
}

// `${locale}:${hash}` -> Promise<string|null>. Caches the in-flight promise itself
// (same idea as fetchStatNames in buildConstants) so concurrent callers dedupe onto
// one lookup; entries that resolve to null are evicted to allow retries.
//
// Lookups go through the single-hash GET endpoint one hash at a time: the Aquila
// gateway CSRF-rejects non-GET requests, which rules out the translator's batch
// POST from the browser. Each unique hash is only ever fetched once per locale per
// session, so the per-page request count stays small.
const translationCache = new Map();

// Resolve any textmap hash (avatar names, relic names, ...) to its translated
// plaintext. Returns a promise of the string, or null when untranslatable.
export function translateHash(locale, hash) {
  if (!hash) return Promise.resolve(null);
  const key = `${locale}:${hash}`;
  if (!translationCache.has(key)) {
    translationCache.set(
      key,
      axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/translate/${locale}/${hash}`)
        .then(res => res.data?.[hash])
        .catch(() => null)
        .then(value => {
          const text = value && value !== MISSING ? stripRenderTags(value) || null : null;
          if (text === null) translationCache.delete(key);
          return text;
        })
    );
  }
  return translationCache.get(key);
}

// Component-friendly wrapper: reads the active locale from the store and returns
// the translated string, or null while loading / when untranslatable.
export function useTranslatedHash(hash) {
  const locale = useSelector(selectLoc);
  const [text, setText] = useState(null);

  useEffect(() => {
    if (!hash) { setText(null); return; }
    let cancelled = false;
    translateHash(locale, hash).then(t => { if (!cancelled) setText(t); });
    return () => { cancelled = true; };
  }, [locale, hash]);

  return text;
}

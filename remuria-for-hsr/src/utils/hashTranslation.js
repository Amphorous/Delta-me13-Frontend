import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectLoc } from '../store/localisationSlice';
import { selectJpKanjiMode } from '../store/settingsSlice';

// The translator returns this sentinel for hashes it has no textmap entry for (and
// for everything while its Redis is still warming up) — treat it as "no translation"
// rather than displaying it, and don't cache it so a later mount can retry.
const MISSING = 'Translation Missing';

// Some textmap strings carry game rendering tags (<unbreak>, <color=...>, ...) that
// mean nothing outside the game client — strip any <...> markup, keep the text.
function stripRenderTags(value) {
  return value.replace(/<[^>]*>/g, '').trim();
}

// JP textmap strings wrap kanji words in furigana ruby markup, e.g.
// "{RUBY_B#たんこう}丹恒{RUBY_E#}・{RUBY_B#とうこう}騰荒{RUBY_E#}" — RUBY_B's
// payload (after the #) is the kana reading, the text between it and RUBY_E
// is the kanji itself. The raw fetched/cached text keeps this markup intact
// (see translateHash below); useTranslatedHash resolves it down to just the
// kanji or just the reading at render time, based on the jpKanjiMode
// setting, so toggling that setting updates displayed names immediately
// without needing to re-fetch or bust the cache.
const RUBY_PATTERN = /\{RUBY_B#([^}]*)\}([^{]*)\{RUBY_E#\}/g;

function resolveRubyText(value, useKanji) {
  return value.replace(RUBY_PATTERN, (_match, reading, kanji) => (useKanji ? kanji : reading));
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
  const jpKanjiMode = useSelector(selectJpKanjiMode);
  const [text, setText] = useState(null);

  useEffect(() => {
    if (!hash) { setText(null); return; }
    let cancelled = false;
    translateHash(locale, hash).then(t => { if (!cancelled) setText(t); });
    return () => { cancelled = true; };
  }, [locale, hash]);

  return locale === 'jp' && text ? resolveRubyText(text, jpKanjiMode) : text;
}

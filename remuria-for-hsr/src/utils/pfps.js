import axios from 'axios';
import { useEffect, useState } from 'react';

export const ANON_PFP_URL = "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";

// headIconId -> iconPath map served by Celestia from Redis (GET /user/pfps),
// replacing the old bundled src/assets/pfps.json — which went stale whenever
// a game version added new profile pictures, since it only updated when the
// frontend itself was rebuilt. The backend copy is refreshed by its asset
// sync cycle instead.
//
// Cached as a module-scope promise (same idea as fetchStatNames in
// buildConstants / translateHash in hashTranslation): one request per
// session, concurrent callers dedupe onto the same in-flight fetch, and a
// failed/empty result is evicted so a later mount can retry.
let pfpMapPromise = null;

export function fetchPfpMap() {
  if (!pfpMapPromise) {
    pfpMapPromise = axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/pfps`)
      .then(res => (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) ? res.data : null)
      .catch(() => null)
      .then(map => {
        if (map === null) pfpMapPromise = null;
        return map;
      });
  }
  return pfpMapPromise;
}

// onError handler for <img src={usePfpUrl(...)}>. Enka's AvatarRoundIcon
// paths are inconsistent about their subfolder — a path served as
// ".../AvatarRoundIcon/Series/200157.png" or ".../AvatarRoundIcon/Avatar/1510.png"
// can 404 even though the same icon resolves one level up without that
// segment. Retry with the segment stripped, then fall back to the anonymous
// placeholder if that also fails. Same cascading-retry shape as
// handleCharacterIconError in dashboard children/relicConstants.js (build
// character icons, a separate /Avatar/-only case) — kept as two functions
// since the callers key off different id types (headIcon vs avatarId).
export function handlePfpImgError(e) {
  const src = e.currentTarget.src;
  if (src.includes('/AvatarRoundIcon/Series/')) {
    e.currentTarget.src = src.replace('/AvatarRoundIcon/Series/', '/AvatarRoundIcon/');
  } else if (src.includes('/AvatarRoundIcon/Avatar/')) {
    e.currentTarget.src = src.replace('/AvatarRoundIcon/Avatar/', '/AvatarRoundIcon/');
  } else if (src !== ANON_PFP_URL) {
    e.currentTarget.src = ANON_PFP_URL;
  }
}

// Full enka URL for a headIcon id, or the anonymous placeholder while the map
// is loading / when the id is unknown — drop-in for the old profileImageGetter.
export function usePfpUrl(headIcon) {
  const [url, setUrl] = useState(ANON_PFP_URL);

  useEffect(() => {
    if (headIcon === undefined || headIcon === null) {
      setUrl(ANON_PFP_URL);
      return;
    }
    let cancelled = false;
    fetchPfpMap().then(map => {
      if (cancelled) return;
      const path = map?.[String(headIcon)];
      setUrl(path ? `https://enka.network${path}` : ANON_PFP_URL);
    });
    return () => { cancelled = true; };
  }, [headIcon]);

  return url;
}

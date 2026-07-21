import axios from 'axios';
import { STAT_ALIASES, characterIconUrl, handleCharacterIconError, relicPieceIconUrl } from '../relicConstants';

export { STAT_ALIASES, characterIconUrl, handleCharacterIconError, relicPieceIconUrl };

export function statLabel(type) {
  const alias = STAT_ALIASES.find(s => s.type === type);
  return alias ? alias.display : type;
}

// Module-scope cache so every BuildDetailCard (and any future consumer) shares one
// fetch per locale instead of re-requesting the same stat-name map repeatedly.
// Caches the in-flight promise itself (not just the resolved value) so concurrent
// callers during the same load also dedupe onto a single request.
const statNameCache = new Map(); // locale -> Promise<Record<string, string>>

export function fetchStatNames(locale) {
  if (!statNameCache.has(locale)) {
    statNameCache.set(
      locale,
      axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/stat-names/${locale}`)
        .then(res => res.data)
        .catch(() => {
          statNameCache.delete(locale); // let a later call retry instead of caching the failure
          return {};
        })
    );
  }
  return statNameCache.get(locale);
}

// build.fightProps.stats arrives as raw HSR fight-prop components (BaseAttack,
// AttackAddedRatio, AttackDelta, ...) rather than finished stat totals. The four
// core stats combine as (base * (1 + addedRatio)) + delta. Every other ratio-style
// stat (crit, break effect, energy regen, elemental dmg%, ...) is already the final
// value by itself and just needs *100 to display as a percentage. Not every build
// carries every key (e.g. a build with no break-effect investment may omit
// BreakDamageAddedRatio entirely) — everything below is looked up defensively.
// nameKey is the raw HSR identifier the /hsr/stat-names/{locale} endpoint keys its
// translations by; labelType is the STAT_ALIASES type used as the offline fallback
// when a translation hasn't loaded (or failed) yet.
const COMBINED_STAT_DEFS = [
  { base: 'BaseHP',      ratio: 'HPAddedRatio',      delta: 'HPDelta',      labelType: 'HPDelta',      nameKey: 'MaxHP' },
  { base: 'BaseAttack',  ratio: 'AttackAddedRatio',  delta: 'AttackDelta',  labelType: 'AttackDelta',  nameKey: 'Attack' },
  { base: 'BaseDefence', ratio: 'DefenceAddedRatio', delta: 'DefenceDelta', labelType: 'DefenceDelta', nameKey: 'Defence' },
  { base: 'BaseSpeed',   ratio: 'SpeedAddedRatio',   delta: 'SpeedDelta',   labelType: 'SpeedDelta',   nameKey: 'Speed' },
];

// Raw fight-prop key -> STAT_ALIASES type to borrow its display label from, for the
// handful of stats whose raw key doesn't already match a STAT_ALIASES type verbatim.
const PERCENT_LABEL_TYPES = {
  CriticalChance: 'CriticalChanceBase',
  CriticalDamage: 'CriticalDamageBase',
  StatusProbability: 'StatusProbabilityBase',
  StatusResistance: 'StatusResistanceBase',
  BreakDamageAddedRatio: 'BreakDamageAddedRatioBase',
  SPRatio: 'SPRatioBase',
  HealRatio: 'HealRatioBase',
};

// statNames is the (optional) already-fetched /hsr/stat-names/{locale} map — see
// fetchStatNames above. Pass null/undefined while it's still loading or failed to
// load; every row falls back to the local STAT_ALIASES-based label in that case.
export function deriveDisplayStats(rawStats, statNames) {
  if (!rawStats) return [];
  const entries = [];
  const consumed = new Set();
  const label = (nameKey, labelType) => statNames?.[nameKey] ?? statLabel(labelType);

  for (const { base, ratio, delta, labelType, nameKey } of COMBINED_STAT_DEFS) {
    if (!(base in rawStats) && !(ratio in rawStats) && !(delta in rawStats)) continue;
    const value = (rawStats[base] ?? 0) * (1 + (rawStats[ratio] ?? 0)) + (rawStats[delta] ?? 0);
    entries.push({ type: labelType, label: label(nameKey, labelType), value: value.toFixed(1) });
    consumed.add(base); consumed.add(ratio); consumed.add(delta);
  }

  if ('BaseAggro' in rawStats) {
    entries.push({ type: 'BaseAggro', label: 'Aggro', value: `${rawStats.BaseAggro}%` });
    consumed.add('BaseAggro');
  }

  // Every other fight-prop key (crit, break effect, energy regen, elemental/Elation
  // dmg%, effect hit/RES, healing, ...) is already a final value by itself — just
  // *100 to display as a percentage. This is deliberately generic rather than an
  // enumerated allowlist: different characters carry different subsets of these keys
  // (and new element/damage types can appear), so anything not already consumed above
  // is assumed to be one of these percentage stats.
  for (const [type, value] of Object.entries(rawStats)) {
    if (consumed.has(type)) continue;
    const labelType = PERCENT_LABEL_TYPES[type] ?? type;
    entries.push({
      type,
      label: label(type, labelType),
      value: typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value,
    });
  }

  return entries;
}

// BuildNode.buildName defaults to this sentinel when a build has never been named.
export const DEFAULT_BUILD_NAME = 'perhaps_feixiao';

// Mirrors the backend's own limit (BuildService.editBuildName) — enforced
// here too so the input can't even be typed past it, not just rejected after
// a round trip.
export const MAX_BUILD_NAME_LENGTH = 32;

export function displayBuildName(buildName) {
  return buildName && buildName !== DEFAULT_BUILD_NAME ? buildName : null;
}

// avatarInfo asset paths already include the /ui/hsr/ prefix ("/ui/hsr/SpriteOutput/...")
// — just prepend the enka host.
export function enkaUiUrl(path) {
  return path ? `https://enka.network${path}` : null;
}

// Ordered skin looks for an avatar: default look first, then alternate skins.
// Each entry is { sideIcon, cutin } (raw asset paths — render via enkaUiUrl).
// Skin ids are numeric-string keys, so Object.values order is ascending numeric —
// stable across renders, which keeps a cycling index meaningful.
export function getSkinList(avatarInfo) {
  if (!avatarInfo) return [];
  const list = [{ sideIcon: avatarInfo.AvatarSideIconPath, cutin: avatarInfo.AvatarCutinFrontImgPath }];
  for (const skin of Object.values(avatarInfo.Skins ?? {})) {
    list.push({ sideIcon: skin.AvatarSideIconPath, cutin: skin.AvatarCutinFrontImgPath });
  }
  return list;
}

// Path (AvatarBaseType) and Element icons — filenames match the raw HSR enum
// values verbatim (e.g. "Warrior.webp", "Fire.webp"), so no alias table is needed.
const pathIconModules = import.meta.glob('../../../../../assets/path_icons/*.webp', { eager: true });
const typeIconModules = import.meta.glob('../../../../../assets/type_icons/*.webp', { eager: true });

function buildIconLookup(modules) {
  const lookup = {};
  for (const [path, mod] of Object.entries(modules)) {
    const name = path.replace(/^.*\//, '').replace(/\.webp$/, '');
    lookup[name] = mod.default;
  }
  return lookup;
}

const PATH_ICONS = buildIconLookup(pathIconModules);
const TYPE_ICONS = buildIconLookup(typeIconModules);

export function pathIconUrl(avatarBaseType) {
  return avatarBaseType ? (PATH_ICONS[avatarBaseType] ?? null) : null;
}

export function elementIconUrl(element) {
  return element ? (TYPE_ICONS[element] ?? null) : null;
}

// AvatarBaseType is HSR's internal dev name for a Path, not what the game
// actually calls it (e.g. a build with AvatarBaseType "Warrior" is Destruction
// path) — this is the display-name mapping for every AvatarBaseType value
// that has an icon under path_icons/. Element's raw enum values (Fire, Ice,
// ...) already match their real in-game names, so no equivalent map is needed
// there.
const PATH_DISPLAY_NAMES = {
  Elation: 'Elation',
  Mage: 'Erudition',
  Priest: 'Abundance',
  Shaman: 'Harmony',
  Warrior: 'Destruction',
  Knight: 'Preservation',
  Memory: 'Remembrance',
  Rogue: 'Hunt',
  Warlock: 'Nihility',
};

// Path/Element filter option lists — same { label, value, icon } shape as the
// relic Slot filter's SLOT_OPTIONS (DashboardsRelics.jsx/RelicFilterHelp.jsx),
// but derived from PATH_ICONS/TYPE_ICONS instead of hardcoded, so a future HSR
// path/element automatically appears here the moment its icon asset is added,
// no list to maintain by hand. `value` stays the raw AvatarBaseType/Element
// string (what the API/pathIconUrl/elementIconUrl key off); `label` is the
// real display name, so fuzzy search (see DashboardBuilds.jsx) matches what
// the user actually knows the path as ("Destruction") rather than the
// internal dev name ("Warrior") — falls back to the raw value for a path
// that's missing from PATH_DISPLAY_NAMES (shouldn't happen, but safer than
// rendering "undefined").
export const PATH_OPTIONS = Object.entries(PATH_ICONS).map(([value, icon]) => ({
  label: PATH_DISPLAY_NAMES[value] ?? value,
  value,
  icon,
}));
export const ELEMENT_OPTIONS = Object.entries(TYPE_ICONS).map(([value, icon]) => ({ label: value, value, icon }));

// Weapon-name label font options (Settings > Build), grouped by which
// locale(s) each font is meant for — mirrors NAME_FONT_CLASS_BY_LOCALE in
// BuildDetailCard.jsx: DotGothic16/Liu Jian Mao Cao/Pattaya were each chosen
// to cover a SPECIFIC script (JP/CN+TW/TH respectively) with no meaningful
// Latin coverage, so they have no business appearing as options under a
// different locale — same reasoning as not showing a CN/TW font when the
// site's language is set to English. Gasoek One is the odd one out: it's
// KR's substitute in NAME_FONT_CLASS_BY_LOCALE, but it's a genuinely
// bilingual Hangul+Latin font, so it's also listed below as a normal Latin
// option — same treatment Press Start 2P already gets for ru (also listed in
// both places).
// LATIN_FONT_OPTIONS covers every locale NOT in FONT_OPTIONS_BY_LOCALE
// (en/de/es/fr/id/pt/vi) — Holiday is first/default.
export const LATIN_FONT_OPTIONS = [
  { label: 'Holiday', value: 'holiday-font' },
  { label: 'League Gothic', value: 'league-gothic-font' },
  { label: 'Badeen Display', value: 'badeen-display-font' },
  { label: 'Bitcount Grid Double', value: 'bitcount-grid-double-font' },
  { label: 'Libre Baskerville', value: 'libre-baskerville-bold' },
  { label: 'Afacad', value: 'afacad-bold' },
  { label: 'Gasoek One', value: 'gasoek-one-font' },
  { label: 'Press Start 2P', value: 'press-start-2p-font' },
];
// Each entry here is the exact single font NAME_FONT_CLASS_BY_LOCALE already
// uses for that locale — one option each for now (no other font covers that
// script yet), and it's also the default, so this matches the name panel
// exactly until more per-script fonts are added.
export const FONT_OPTIONS_BY_LOCALE = {
  jp: [{ label: 'DotGothic16', value: 'dotgothic16-font' }],
  kr: [{ label: 'Gasoek One', value: 'gasoek-one-font' }],
  cn: [{ label: 'Liu Jian Mao Cao', value: 'liu-jian-mao-cao-font' }],
  tw: [{ label: 'Liu Jian Mao Cao', value: 'liu-jian-mao-cao-font' }],
  th: [{ label: 'Pattaya', value: 'pattaya-font' }],
  ru: [{ label: 'Press Start 2P', value: 'press-start-2p-font' }],
};

export function weaponNameFontOptionsForLocale(locale) {
  return FONT_OPTIONS_BY_LOCALE[locale] ?? LATIN_FONT_OPTIONS;
}

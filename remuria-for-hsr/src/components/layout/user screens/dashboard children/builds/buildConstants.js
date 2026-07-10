import axios from 'axios';
import { STAT_ALIASES, characterIconUrl, relicPieceIconUrl } from '../relicConstants';

export { STAT_ALIASES, characterIconUrl, relicPieceIconUrl };

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

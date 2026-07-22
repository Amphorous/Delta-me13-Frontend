// Game-native rarity tiers (relics + weapons) — NOT the site's own theme
// accent, deliberately not run through the --accent-* CSS vars. Keyed by the
// rarity digit as a string ("3"-"6"), matching how it's already represented
// both in relic tid parsing (relicMetaInfo[0], see parseTid in
// relicConstants.js) and in the weapon CONTAINS_WEAPON edge's own `rarity`
// property (Celestia stores it as a string too).
const RARITY_BORDER_COLORS = {
  '6': 'border-amber-400/40',
  '5': 'border-purple-400/40',
  '4': 'border-blue-400/40',
  '3': 'border-gray-400/40',
};
const RARITY_BG_COLORS = {
  '6': 'bg-amber-400/40',
  '5': 'bg-purple-400/40',
  '4': 'bg-blue-400/40',
  '3': 'bg-gray-400/40',
};
const RARITY_TEXT_COLORS = {
  '6': 'text-amber-200/80',
  '5': 'text-purple-200/80',
  '4': 'text-blue-200/80',
  '3': 'text-gray-200/80',
};

export function rarityBorderColor(rarity) {
  return RARITY_BORDER_COLORS[String(rarity)];
}
export function rarityBgColor(rarity) {
  return RARITY_BG_COLORS[String(rarity)];
}
export function rarityTextColor(rarity) {
  return RARITY_TEXT_COLORS[String(rarity)];
}

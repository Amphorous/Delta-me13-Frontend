import iconAttack from "../../../../assets/downloaded_icons/IconAttack.png"
import iconBreakUp from "../../../../assets/downloaded_icons/IconBreakUp.png"
import iconCriticalChance from "../../../../assets/downloaded_icons/IconCriticalChance.png"
import iconCriticalDamage from "../../../../assets/downloaded_icons/IconCriticalDamage.png"
import iconDefence from "../../../../assets/downloaded_icons/IconDefence.png"
import iconFireAddedRatio from "../../../../assets/downloaded_icons/IconFireAddedRatio.png"
import iconIceAddedRatio from "../../../../assets/downloaded_icons/IconIceAddedRatio.png"
import iconImaginaryAddedRatio from "../../../../assets/downloaded_icons/IconImaginaryAddedRatio.png"
import iconJoy from "../../../../assets/downloaded_icons/IconJoy.png"
import iconMaxHP from "../../../../assets/downloaded_icons/IconMaxHP.png"
import iconHealRatio from "../../../../assets/downloaded_icons/IconHealRatio.png"
import iconPhysicalAddedRatio from "../../../../assets/downloaded_icons/IconPhysicalAddedRatio.png"
import iconQuantumAddedRatio from "../../../../assets/downloaded_icons/IconQuantumAddedRatio.png"
import iconSpeed from "../../../../assets/downloaded_icons/IconSpeed.png"
import iconStatusProbability from "../../../../assets/downloaded_icons/IconStatusProbability.png"
import iconStatusResistance from "../../../../assets/downloaded_icons/IconStatusResistance.png"
import iconThunderAddedRatio from "../../../../assets/downloaded_icons/IconThunderAddedRatio.png"
import iconWindAddedRatio from "../../../../assets/downloaded_icons/IconWindAddedRatio.png"
import iconSPRatio from "../../../../assets/downloaded_icons/IconSPRatio.png"

export const STAT_ALIASES = [
  { labels: ['cv'],                                              type: 'CV',                         display: 'CV' },
  { labels: ['crit dmg', 'criticaldamage', 'cdmg', 'cd'],       type: 'CriticalDamageBase',         display: 'CRIT DMG' },
  { labels: ['crit rate', 'criticalchance', 'crit'],             type: 'CriticalChanceBase',         display: 'CRIT Rate' },
  { labels: ['atk%', 'attack%'],                                 type: 'AttackAddedRatio',           display: 'ATK%' },
  { labels: ['atk', 'attack'],                                   type: 'AttackDelta',                display: 'ATK' },
  { labels: ['break', 'breakdamage'],                            type: 'BreakDamageAddedRatioBase',  display: 'Break' },
  { labels: ['def%', 'defence%', 'defense%'],                    type: 'DefenceAddedRatio',          display: 'DEF%' },
  { labels: ['def', 'defence', 'defense'],                       type: 'DefenceDelta',               display: 'DEF' },
  { labels: ['fire'],                                            type: 'FireAddedRatio',             display: 'Fire' },
  { labels: ['ice'],                                             type: 'IceAddedRatio',              display: 'Ice' },
  { labels: ['imaginary', 'img'],                                type: 'ImaginaryAddedRatio',        display: 'Imaginary' },
  { labels: ['healing', 'heal'],                                 type: 'HealRatioBase',              display: 'Healing' },
  { labels: ['elation', 'joy'],                                  type: 'ElationDamageAddedRatio',    display: 'Elation' },
  { labels: ['hp%'],                                             type: 'HPAddedRatio',               display: 'HP%' },
  { labels: ['hp'],                                              type: 'HPDelta',                    display: 'HP' },
  { labels: ['physical', 'phys'],                                type: 'PhysicalAddedRatio',         display: 'Physical' },
  { labels: ['quantum', 'quant'],                                type: 'QuantumAddedRatio',          display: 'Quantum' },
  { labels: ['spd', 'speed'],                                    type: 'SpeedDelta',                 display: 'SPD' },
  { labels: ['eff hit', 'effhit', 'probability'],                type: 'StatusProbabilityBase',      display: 'Eff Hit' },
  { labels: ['eff res', 'effres', 'resistance'],                 type: 'StatusResistanceBase',       display: 'Eff RES' },
  { labels: ['lightning', 'thunder'],                            type: 'ThunderAddedRatio',          display: 'Lightning' },
  { labels: ['wind'],                                            type: 'WindAddedRatio',             display: 'Wind' },
  { labels: ['energy', 'sp ratio', 'spratio'],                   type: 'SPRatioBase',                display: 'Energy' },
];

export const SLOT_ALIASES = {
  'head': '1',
  'hands': '2', 'hand': '2', 'gloves': '2',
  'body': '3', 'chest': '3',
  'feet': '4', 'foot': '4', 'boots': '4',
  'sphere': '5', 'orb': '5', 'planar sphere': '5',
  'rope': '6', 'link rope': '6', 'link': '6',
};

export function slotDisplayName(type) {
  switch (type) {
    case '1': return 'Head';
    case '2': return 'Hands';
    case '3': return 'Body';
    case '4': return 'Feet';
    case '5': return 'Sphere';
    case '6': return 'Rope';
    default: return type;
  }
}

// A relic tid segments into [ rarity+1, setId, position/type ]
export function parseTid(tid) {
  if (!tid) return null;
  return [tid.substring(0, 1), tid.substring(1, tid.length - 1), tid.substring(tid.length - 1)];
}

export function relicPieceIconUrl(tid) {
  const meta = parseTid(tid);
  if (!meta) return null;
  return `https://enka.network/ui/hsr/SpriteOutput/ItemIcon/RelicIcons/IconRelic_${meta[1]}_${meta[2]}.png`;
}

export function statIconGetter(statType) {
  if (!statType) return undefined;
  const t = statType.toLowerCase();
  if (t.includes("attack")) return iconAttack;
  else if (t.includes("break")) return iconBreakUp;
  else if (t.includes("criticalchance")) return iconCriticalChance;
  else if (t.includes("criticaldamage")) return iconCriticalDamage;
  else if (t.includes("defence")) return iconDefence;
  else if (t.includes("fireaddedratio")) return iconFireAddedRatio;
  else if (t.includes("iceaddedratio")) return iconIceAddedRatio;
  else if (t.includes("imaginaryaddedratio")) return iconImaginaryAddedRatio;
  else if (t.includes("elationdamageaddedratio")) return iconJoy;
  else if (t.includes("hp")) return iconMaxHP;
  else if (t.includes("physicaladdedratio")) return iconPhysicalAddedRatio;
  else if (t.includes("quantumaddedratio")) return iconQuantumAddedRatio;
  else if (t.includes("speed")) return iconSpeed;
  else if (t.includes("statusprobability")) return iconStatusProbability;
  else if (t.includes("statusresistance")) return iconStatusResistance;
  else if (t.includes("thunderaddedratio")) return iconThunderAddedRatio;
  else if (t.includes("windaddedratio")) return iconWindAddedRatio;
  else if (t.includes("heal")) return iconHealRatio;
  else if (t.includes("sp")) return iconSPRatio;
}

const ANON_CHARACTER_ICON_URL = "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";

export function characterIconUrl(avatarId) {
  return `https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/Avatar/${avatarId}.png`;
}

// onError handler for <img src={characterIconUrl(...)}>. Not every avatarId
// actually resolves under the /Avatar/ path on enka's CDN — retry one level up
// without that segment, then fall back to the anonymous placeholder if that
// also 404s. Same cascading-retry shape as the /Series/ handling in
// UserCard.jsx/UserLongCard.jsx for the user profile icon.
export function handleCharacterIconError(e) {
  const src = e.currentTarget.src;
  if (src.includes('/AvatarRoundIcon/Avatar/')) {
    e.currentTarget.src = src.replace('/AvatarRoundIcon/Avatar/', '/AvatarRoundIcon/');
  } else if (src !== ANON_CHARACTER_ICON_URL) {
    e.currentTarget.src = ANON_CHARACTER_ICON_URL;
  }
}

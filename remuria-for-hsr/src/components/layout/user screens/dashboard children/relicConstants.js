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
  { labels: ['elation', 'joy'],                                  type: 'Joy',                        display: 'Elation' },
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

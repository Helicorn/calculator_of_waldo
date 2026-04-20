import type { ChampionType } from "@/app/types/games/lol";

/** 레벨에 따라 변하는 ‘최종’ 능력치만 표시 (Data Dragon perlevel 키 제외) */
export const COMPUTED_STAT_KEYS = [
  "hp",
  "mp",
  "movespeed",
  "armor",
  "spellblock",
  "attackrange",
  "hpregen",
  "mpregen",
  "crit",
  "attackdamage",
  "attackspeed",
] as const;

export type ComputedStatKey = (typeof COMPUTED_STAT_KEYS)[number];

export const MIN_CHAMPION_LEVEL = 1;
export const MAX_CHAMPION_LEVEL = 18;

export function clampChampionLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_CHAMPION_LEVEL;
  return Math.min(
    MAX_CHAMPION_LEVEL,
    Math.max(MIN_CHAMPION_LEVEL, Math.round(level)),
  );
}

/**
 * 레벨 L 기준 능력치 (솔랭 기본 성장, 룬·아이템·버프 없음)
 * - 대부분: base + (L-1) × perLevel
 * - 공격 속도: base × (1 + (attackspeedperlevel/100) × (L-1))
 */
export function computeChampionStatsAtLevel(
  stats: ChampionType["stats"],
  level: number,
): Record<ComputedStatKey, number> {
  const L = clampChampionLevel(level);
  const d = L - 1;

  return {
    hp: stats.hp + stats.hpperlevel * d,
    mp: stats.mp + stats.mpperlevel * d,
    movespeed: stats.movespeed,
    armor: stats.armor + stats.armorperlevel * d,
    spellblock: stats.spellblock + stats.spellblockperlevel * d,
    attackrange: stats.attackrange,
    hpregen: stats.hpregen + stats.hpregenperlevel * d,
    mpregen: stats.mpregen + stats.mpregenperlevel * d,
    crit: stats.crit + stats.critperlevel * d,
    attackdamage: stats.attackdamage + stats.attackdamageperlevel * d,
    attackspeed:
      stats.attackspeed * (1 + (stats.attackspeedperlevel / 100) * d),
  };
}

export function formatComputedStatValue(
  key: ComputedStatKey,
  value: number,
): string {
  if (!Number.isFinite(value)) return "—";
  switch (key) {
    case "hp":
    case "mp":
    case "movespeed":
    case "attackrange":
      return String(Math.round(value));
    case "armor":
    case "spellblock":
    case "attackdamage":
      return Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-6
        ? String(Math.round(value))
        : value.toFixed(1);
    case "hpregen":
    case "mpregen":
      return value.toFixed(2);
    case "crit":
      return value.toFixed(3);
    case "attackspeed":
      return value.toFixed(3);
    default:
      return String(value);
  }
}

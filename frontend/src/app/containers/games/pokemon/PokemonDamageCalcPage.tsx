"use client";

import { Jua } from "next/font/google";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import pokemon from "pokemon";

import { EvInputBox } from "./components/EvInputBox";
import { MoveOptionCombobox } from "./components/MoveOptionCombobox";
import { PokemonNameCombobox } from "./PokemonNameCombobox";
import { apiFetch } from "@/lib/apiFetch";
import {
  ROTOM_FORM_OPTIONS,
  getRotomFormTypes,
  isRotomName,
  type RotomFormKey,
} from "@/lib/pokemon/formConfigs";
import {
  CHARIZARD_FORM_OPTIONS,
  getCharizardFormOverride,
  isCharizardName,
  type CharizardFormKey,
} from "@/lib/pokemon/megaEvolution";
import damageClassNameMap from "@/lib/pokemon/damageClassNameMap.json";
import { ROTOM_FORM_MOVE_OVERRIDES } from "@/lib/pokemon/specialRules/rotomFormMoveOverrides";
import {
  AEGISLASH_BLADE_BASE_STATS,
  AEGISLASH_SHIELD_BASE_STATS,
  KINGS_SHIELD_MOVE_ID,
  SPECIAL_MOVE_RULES,
} from "@/lib/pokemon/specialRules/specialMoveRules";
import { TYPE_COLOR_BY_NAME } from "@/lib/pokemon/typeColorByName";
import { TYPE_EFFECTIVENESS_CHART } from "@/lib/pokemon/typeEffectivenessChart";
import typeNameMap from "@/lib/pokemon/typeNameMap.json";

/** 배달의민족 주아 (Google Fonts: Jua) */
const baeminJua = Jua({
  weight: "400",
  subsets: ["latin"],
  preload: true,
});

type PokemonApiResponse = {
  id: number;
  name: string;
  stats?: Array<{
    base_stat: number;
    stat?: {
      name?: string;
    };
  }>;
  types?: Array<{
    slot: number;
    type?: {
      name?: string;
    };
  }>;
  moves?: Array<{
    move?: {
      name?: string;
      url?: string;
    };
  }>;
};

type MoveMeta = {
  power: number | null;
  typeName: string;
  damageClass: string | null;
  accuracy: number | null;
};

/** {@code GET /api/waldo/games/pokemon/moves} 응답 한 행 */
type WaldoMoveRow = {
  id: number;
  nameKo: string | null;
  nameEn: string | null;
  typeName: string | null;
  power: number | null;
  damageClass: string | null;
  accuracy: number | null;
};

type DamageCalcMoveOption = {
  moveId: number;
  label: string;
  meta: MoveMeta;
};

/** PokeAPI move 리소스 URL에서 기술 번호 추출 */
function extractMoveIdFromPokeapiUrl(url: string): number | null {
  const m = url.trim().match(/\/move\/(\d+)\b/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

/** 목록 표시: {@code T_POKEMON_MOVE.MOVE_NAME_KO} 우선, 없으면 영문명 */
function labelMoveFromDbRow(row: WaldoMoveRow, fallbackId: number): string {
  const ko = row.nameKo?.trim();
  if (ko) return ko;
  const en = row.nameEn?.trim();
  if (en) return en;
  return `#${fallbackId}`;
}

/**
 * 선택한 포켓몬 도감(`moves`) 순서대로, {@code T_POKEMON_MOVE}에 있는 기술만 나열.
 * 같은 기술이 버전별로 여러 번 나와도 한 번만 표시합니다.
 */
function learnsetMovesMatchingDb(
  moves: PokemonApiResponse["moves"] | undefined,
  byId: Map<number, WaldoMoveRow>,
): DamageCalcMoveOption[] {
  const acc: DamageCalcMoveOption[] = [];
  const seen = new Set<number>();
  for (const item of moves ?? []) {
    const url = item.move?.url?.trim() ?? "";
    if (!url) continue;
    const id = extractMoveIdFromPokeapiUrl(url);
    if (id == null) continue;
    if (seen.has(id)) continue;
    const row = byId.get(id);
    if (!row) continue;
    seen.add(id);
    acc.push({
      moveId: id,
      label: labelMoveFromDbRow(row, id),
      meta: {
        power: typeof row.power === "number" ? row.power : null,
        typeName: row.typeName?.trim() || "-",
        damageClass: row.damageClass?.trim() ?? null,
        accuracy:
          typeof row.accuracy === "number" && Number.isFinite(row.accuracy)
            ? row.accuracy
            : null,
      },
    });
  }
  return acc;
}

/** 실스탯 카드와 같은 라벨·박스 패턴, 한 단계 작은 크기 */
function MoveInfoMiniCard({ label, value }: { label: string; value: string }) {
  const surface =
    "relative flex min-h-[3.125rem] flex-col rounded-2xl border border-black/[.12] bg-neutral-50 px-2 pb-2 pt-3.5 dark:border-white/[.16] dark:bg-neutral-900/90";
  const legendBg = "bg-transparent px-1";
  return (
    <div className={surface}>
      <span
        className={`${baeminJua.className} absolute left-2 top-0 z-10 -translate-y-1/2 text-[10px] font-medium text-neutral-600 ${legendBg} dark:text-neutral-400`}
      >
        {label}
      </span>
      <p className="flex flex-1 min-h-[1.5rem] items-center justify-center text-center text-sm font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
    </div>
  );
}

function getPokemonTypeNames(data: PokemonApiResponse | null): string[] {
  return (data?.types ?? [])
    .slice()
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
    .map((t) => t.type?.name?.trim().toLowerCase() ?? "")
    .filter((name) => name.length > 0);
}

function getTypeEffectivenessMultiplier(
  attackType: string,
  defenderTypes: string[],
): number {
  const atk = attackType.trim().toLowerCase();
  if (!atk || defenderTypes.length === 0) return 1;
  const row = TYPE_EFFECTIVENESS_CHART[atk] ?? {};
  return defenderTypes.reduce((acc, defType) => {
    const d = defType.trim().toLowerCase();
    const mul = row[d] ?? 1;
    return acc * mul;
  }, 1);
}

type DamageSummary = {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  stab: number;
  effectiveness: number;
  critical: number;
  weather: number;
  ruleNote?: string;
} | null;

type WeatherKind = "none" | "sunny" | "rain" | "sandstorm" | "snow";
type RankStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

const RANK_STAGE_OPTIONS: RankStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

function rankStageMultiplier(stage: RankStage): number {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 + Math.abs(stage));
}

function applyRotomFormMoveOverrides(
  baseMoves: DamageCalcMoveOption[],
  byId: Map<number, WaldoMoveRow>,
  form: RotomFormKey,
): DamageCalcMoveOption[] {
  const override = ROTOM_FORM_MOVE_OVERRIDES[form];
  if (!override || override.addMoveIds.length === 0) return baseMoves;

  const next = [...baseMoves];
  const seen = new Set(next.map((m) => m.moveId));
  for (const moveId of override.addMoveIds) {
    if (seen.has(moveId)) continue;
    const row = byId.get(moveId);
    if (!row) continue;
    seen.add(moveId);
    next.push({
      moveId,
      label: labelMoveFromDbRow(row, moveId),
      meta: {
        power: typeof row.power === "number" ? row.power : null,
        typeName: row.typeName?.trim() || "-",
        damageClass: row.damageClass?.trim() ?? null,
        accuracy:
          typeof row.accuracy === "number" && Number.isFinite(row.accuracy)
            ? row.accuracy
            : null,
      },
    });
  }
  return next;
}

function weatherLabel(weather: WeatherKind): string {
  switch (weather) {
    case "sunny":
      return "쾌청";
    case "rain":
      return "비";
    case "sandstorm":
      return "모래바람";
    case "snow":
      return "눈";
    default:
      return "없음";
  }
}

function weatherDamageMultiplier(moveType: string, weather: WeatherKind): number {
  const t = moveType.trim().toLowerCase();
  if (weather === "sunny") {
    if (t === "fire") return 1.5;
    if (t === "water") return 0.5;
  }
  if (weather === "rain") {
    if (t === "water") return 1.5;
    if (t === "fire") return 0.5;
  }
  return 1;
}

function RankSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: RankStage;
  onChange: (next: RankStage) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className={`${baeminJua.className} text-xs font-semibold text-neutral-700 dark:text-neutral-300`}
      >
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) as RankStage)}
        className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
      >
        {RANK_STAGE_OPTIONS.map((stage) => (
          <option key={stage} value={stage}>
            {stage > 0 ? `+${stage}` : String(stage)}
          </option>
        ))}
      </select>
    </div>
  );
}

function computeDamageSummary({
  attackerStats,
  defenderStats,
  attackerTypes,
  defenderTypes,
  moveId,
  moveMeta,
  isCritical,
  forceStab,
  weather,
  attackerAttackRank,
  attackerSpecialAttackRank,
  defenderAttackRank,
  defenderSpecialAttackRank,
  defenderDefenseRank,
  defenderSpecialDefenseRank,
}: {
  attackerStats: Record<string, number> | null;
  defenderStats: Record<string, number> | null;
  attackerTypes: string[];
  defenderTypes: string[];
  moveId: number | null;
  moveMeta: MoveMeta | null;
  isCritical: boolean;
  forceStab: boolean;
  weather: WeatherKind;
  attackerAttackRank: RankStage;
  attackerSpecialAttackRank: RankStage;
  defenderAttackRank: RankStage;
  defenderSpecialAttackRank: RankStage;
  defenderDefenseRank: RankStage;
  defenderSpecialDefenseRank: RankStage;
}): DamageSummary {
  if (!attackerStats || !defenderStats || !moveMeta) return null;
  const power = moveMeta.power;
  if (power == null || !Number.isFinite(power) || power <= 0) return null;

  const specialRule = moveId != null ? SPECIAL_MOVE_RULES[moveId] : undefined;
  const damageClass = (moveMeta.damageClass ?? "").trim().toLowerCase();
  const isSpecial = damageClass === "special";
  const attackStatSource =
    specialRule?.kind === "stat_source_override" &&
    specialRule.attackStatOwner === "defender"
      ? defenderStats
      : attackerStats;
  const attackStat = isSpecial
    ? attackStatSource["special-attack"]
    : attackStatSource.attack;
  const defenseStat = isSpecial
    ? defenderStats["special-defense"]
    : defenderStats.defense;
  const attackRank =
    specialRule?.kind === "stat_source_override" &&
    (specialRule.attackRankOwner ?? specialRule.attackStatOwner) === "defender"
      ? isSpecial
        ? defenderSpecialAttackRank
        : defenderAttackRank
      : isSpecial
        ? attackerSpecialAttackRank
        : attackerAttackRank;
  const defenseRank = isSpecial ? defenderSpecialDefenseRank : defenderDefenseRank;
  const rankedAttackStat = Math.max(1, Math.floor(attackStat * rankStageMultiplier(attackRank)));
  const rankedDefenseStat = Math.max(
    1,
    Math.floor(defenseStat * rankStageMultiplier(defenseRank)),
  );
  const defenderHp = defenderStats.hp;
  if (
    !Number.isFinite(rankedAttackStat) ||
    !Number.isFinite(rankedDefenseStat) ||
    !Number.isFinite(defenderHp) ||
    rankedAttackStat <= 0 ||
    rankedDefenseStat <= 0 ||
    defenderHp <= 0
  ) {
    return null;
  }

  const level = DISPLAY_LEVEL;
  const base1 = Math.floor((2 * level) / 5 + 2);
  const baseDamageByPower = (powerValue: number) => {
    const base2 = Math.floor((base1 * powerValue * rankedAttackStat) / rankedDefenseStat);
    const base3 = Math.floor(base2 / 50);
    return Math.max(1, base3 + 2);
  };

  const moveType = (moveMeta.typeName ?? "").trim().toLowerCase();
  const weatherChangedType =
    specialRule?.kind === "weather_power_multiplier" && weather !== "none"
      ? specialRule.weatherTypeByWeather?.[weather]
      : undefined;
  const effectiveMoveType = (weatherChangedType ?? moveType).trim().toLowerCase();
  const stab = forceStab || attackerTypes.includes(effectiveMoveType) ? 1.5 : 1;
  const effectiveness = getTypeEffectivenessMultiplier(effectiveMoveType, defenderTypes);
  const critical = isCritical ? 1.5 : 1;
  const weatherMul = weatherDamageMultiplier(effectiveMoveType, weather);

  const weatherPowerMultiplier =
    specialRule?.kind === "weather_power_multiplier" && weather !== "none"
      ? specialRule.multiplier
      : 1;
  const effectivePower = power * weatherPowerMultiplier;
  let minDamage: number;
  let maxDamage: number;
  let ruleNote: string | undefined;
  if (specialRule?.kind === "power_sequence") {
    minDamage = specialRule.powers.reduce((acc, p) => {
      const hit = baseDamageByPower(p);
      return acc + Math.max(1, Math.floor(hit * stab * effectiveness * critical * weatherMul * 0.85));
    }, 0);
    maxDamage = specialRule.powers.reduce((acc, p) => {
      const hit = baseDamageByPower(p);
      return acc + Math.max(1, Math.floor(hit * stab * effectiveness * critical * weatherMul));
    }, 0);
    ruleNote = specialRule.note;
  } else {
    const baseDamage = baseDamageByPower(effectivePower);
    minDamage = Math.max(
      1,
      Math.floor(baseDamage * stab * effectiveness * critical * weatherMul * 0.85),
    );
    maxDamage = Math.max(
      1,
      Math.floor(baseDamage * stab * effectiveness * critical * weatherMul * 1),
    );
    if (
      (weatherPowerMultiplier !== 1 || weatherChangedType) &&
      specialRule?.kind === "weather_power_multiplier"
    ) {
      ruleNote = specialRule.note;
    } else if (specialRule?.kind === "stat_source_override") {
      ruleNote = specialRule.note;
    }
  }
  const minPercent = (minDamage / defenderHp) * 100;
  const maxPercent = (maxDamage / defenderHp) * 100;
  return {
    minDamage,
    maxDamage,
    minPercent,
    maxPercent,
    stab,
    effectiveness,
    critical,
    weather: weatherMul,
    ruleNote,
  };
}

/** 선택 포켓몬 타입에 따라 카드 배경색(2타입이면 그라데이션) */
function cardStyleByPokemonTypes(types: string[]): CSSProperties | undefined {
  if (types.length === 0) return undefined;
  const c1 = TYPE_COLOR_BY_NAME[types[0]] ?? "#9CA3AF";
  if (types.length === 1) {
    return {
      backgroundImage: `linear-gradient(180deg, ${c1}20 0%, rgba(255,255,255,0) 70%)`,
    };
  }
  const c2 = TYPE_COLOR_BY_NAME[types[1]] ?? c1;
  return {
    backgroundImage: `linear-gradient(135deg, ${c1}22 0%, ${c2}22 100%)`,
  };
}

function MoveDetailPanel({ meta }: { meta: MoveMeta | null }) {
  const moveTypeLabelRaw = meta?.typeName?.trim().toLowerCase() ?? "";
  const moveTypeLabel = moveTypeLabelRaw
    ? typeNameMap[moveTypeLabelRaw as keyof typeof typeNameMap] ?? moveTypeLabelRaw
    : "—";
  const pwr =
    meta?.power != null && Number.isFinite(meta.power) ? String(meta.power) : "—";
  const acc = meta?.accuracy;
  const accLabel =
    typeof acc === "number" && Number.isFinite(acc) ? String(acc) : "—";
  const damageClassRaw = meta?.damageClass?.trim().toLowerCase() ?? "";
  const damageClassLabel = damageClassRaw
    ? damageClassNameMap[damageClassRaw as keyof typeof damageClassNameMap] ??
      damageClassRaw
    : "—";
  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MoveInfoMiniCard label="기술 타입" value={moveTypeLabel} />
        <MoveInfoMiniCard label="위력" value={pwr} />
        <MoveInfoMiniCard
          label="공격 형태"
          value={damageClassLabel}
        />
        <MoveInfoMiniCard label="정확도" value={accLabel} />
      </div>
    </div>
  );
}

function waldoMoveRowId(row: WaldoMoveRow): number | null {
  const raw = row.id as unknown;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

const BASE_STAT_ROWS = [
  { statName: "hp", label: "체력" },
  { statName: "attack", label: "공격" },
  { statName: "defense", label: "방어" },
  { statName: "special-attack", label: "특공" },
  { statName: "special-defense", label: "특방" },
  { statName: "speed", label: "스피드" },
] as const;

type StatName = (typeof BASE_STAT_ROWS)[number]["statName"];
type EvMap = Record<StatName, number>;
type NonHpStatName = Exclude<StatName, "hp">;
type NatureEntry = {
  key: string;
  label: string;
  up?: NonHpStatName;
  down?: NonHpStatName;
};

/** 포챔스식: 공식의 floor(노력치/4) 항에 0~32 정수를 그대로 사용 */
const POC_MAX_EV_TERM = 32;
/** 능력치별 노력치 합산 상한 */
const POC_MAX_EV_TOTAL = 66;
const DEFAULT_NATURE_KEY = "hardy";
const STAT_LABEL_BY_NAME: Record<StatName, string> = Object.fromEntries(
  BASE_STAT_ROWS.map((row) => [row.statName, row.label]),
) as Record<StatName, string>;
const NON_HP_STATS: NonHpStatName[] = [
  "attack",
  "defense",
  "speed",
  "special-attack",
  "special-defense",
];
const NEUTRAL_NATURE_KEY_BY_STAT: Record<NonHpStatName, string> = {
  attack: "hardy",
  defense: "docile",
  speed: "serious",
  "special-attack": "bashful",
  "special-defense": "quirky",
};

const NATURES: NatureEntry[] = [
  { key: "hardy", label: "성실 (Hardy)" },
  { key: "lonely", label: "외로움 (Lonely)", up: "attack", down: "defense" },
  { key: "brave", label: "용감 (Brave)", up: "attack", down: "speed" },
  { key: "adamant", label: "고집 (Adamant)", up: "attack", down: "special-attack" },
  { key: "naughty", label: "개구쟁이 (Naughty)", up: "attack", down: "special-defense" },
  { key: "bold", label: "대담 (Bold)", up: "defense", down: "attack" },
  { key: "docile", label: "온순 (Docile)" },
  { key: "relaxed", label: "무사태평 (Relaxed)", up: "defense", down: "speed" },
  { key: "impish", label: "장난꾸러기 (Impish)", up: "defense", down: "special-attack" },
  { key: "lax", label: "촐랑 (Lax)", up: "defense", down: "special-defense" },
  { key: "timid", label: "겁쟁이 (Timid)", up: "speed", down: "attack" },
  { key: "hasty", label: "성급 (Hasty)", up: "speed", down: "defense" },
  { key: "serious", label: "성급하지않음 (Serious)" },
  { key: "jolly", label: "명랑 (Jolly)", up: "speed", down: "special-attack" },
  { key: "naive", label: "천진난만 (Naive)", up: "speed", down: "special-defense" },
  { key: "modest", label: "조심 (Modest)", up: "special-attack", down: "attack" },
  { key: "mild", label: "덜렁 (Mild)", up: "special-attack", down: "defense" },
  { key: "quiet", label: "냉정 (Quiet)", up: "special-attack", down: "speed" },
  { key: "bashful", label: "수줍음 (Bashful)" },
  { key: "rash", label: "덜렁대는 (Rash)", up: "special-attack", down: "special-defense" },
  { key: "calm", label: "차분 (Calm)", up: "special-defense", down: "attack" },
  { key: "gentle", label: "얌전 (Gentle)", up: "special-defense", down: "defense" },
  { key: "sassy", label: "건방 (Sassy)", up: "special-defense", down: "speed" },
  { key: "careful", label: "신중 (Careful)", up: "special-defense", down: "special-attack" },
  { key: "quirky", label: "변덕 (Quirky)" },
];

function getNatureByKey(key: string): NatureEntry {
  return NATURES.find((nature) => nature.key === key) ?? NATURES[0];
}

function getNatureByUpDown(up: NonHpStatName, down: NonHpStatName): NatureEntry {
  if (up === down) {
    return getNatureByKey(NEUTRAL_NATURE_KEY_BY_STAT[up]);
  }
  return (
    NATURES.find((nature) => nature.up === up && nature.down === down) ??
    getNatureByKey(DEFAULT_NATURE_KEY)
  );
}

function getNatureShortLabel(nature: NatureEntry): string {
  return nature.label.split(" ")[0];
}

function getNatureModifier(natureKey: string, statName: StatName): number {
  if (statName === "hp") return 1;
  const nature = getNatureByKey(natureKey);
  if (nature.up === statName) return 1.1;
  if (nature.down === statName) return 0.9;
  return 1;
}

/** 표시용: Gen3+ 실스탯 공식 */
const DISPLAY_LEVEL = 50;
const DISPLAY_IV = 31;

function clampEvTerm(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(POC_MAX_EV_TERM, Math.max(0, Math.floor(n)));
}

function defaultEvMap(): EvMap {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    "special-attack": 0,
    "special-defense": 0,
    speed: 0,
  };
}

function sumEvOtherThan(prev: EvMap, exclude: StatName): number {
  return BASE_STAT_ROWS.filter((r) => r.statName !== exclude).reduce(
    (acc, r) => acc + prev[r.statName],
    0,
  );
}

/** 한 스탯 변경 시 능력치당 0~32 + 총합 ≤ POC_MAX_EV_TOTAL */
function applyEvChange(prev: EvMap, stat: StatName, requested: number): EvMap {
  const v = clampEvTerm(requested);
  const sumOthers = sumEvOtherThan(prev, stat);
  const maxForStat = Math.min(
    POC_MAX_EV_TERM,
    Math.max(0, POC_MAX_EV_TOTAL - sumOthers),
  );
  return { ...prev, [stat]: Math.min(v, maxForStat) };
}

function realStatHp(
  base: number,
  level: number,
  iv: number,
  evTerm: number,
): number {
  const e = clampEvTerm(evTerm);
  return (
    Math.floor(((2 * base + iv + e) * level) / 100) +
    level +
    10
  );
}

function realStatNonHp(
  base: number,
  level: number,
  iv: number,
  evTerm: number,
  natureModifier: number,
): number {
  const e = clampEvTerm(evTerm);
  const inner = Math.floor(((2 * base + iv + e) * level) / 100) + 5;
  return Math.floor(inner * natureModifier);
}

/** 종족값 맵 → 50레벨·31V 실스탯 (성격 보정 없음 ×1) */
function level50StatsFromBases(
  bases: Record<string, number> | null,
  evByStat: EvMap,
  natureKey: string,
): Record<string, number> | null {
  if (!bases) return null;
  const level = DISPLAY_LEVEL;
  const iv = DISPLAY_IV;
  const out: Record<string, number> = {};
  for (const row of BASE_STAT_ROWS) {
    const b = bases[row.statName];
    if (typeof b !== "number") return null;
    const evTerm = evByStat[row.statName] ?? 0;
    out[row.statName] =
      row.statName === "hp"
        ? realStatHp(b, level, iv, evTerm)
        : realStatNonHp(
            b,
            level,
            iv,
            evTerm,
            getNatureModifier(natureKey, row.statName),
          );
  }
  return out;
}

function safeGetPokemonIdByKoreanName(name: string): number | null {
  try {
    const id = pokemon.getId(name, "ko");
    return typeof id === "number" && Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function statsRecordFromPokemon(
  data: PokemonApiResponse | null,
): Record<string, number> | null {
  if (!data?.stats?.length) return null;
  return Object.fromEntries(
    data.stats.map((item) => [item.stat?.name ?? "", item.base_stat]),
  );
}

function applyBaseStatOverride(
  baseStats: Record<string, number> | null,
  override: Partial<Record<StatName, number>> | undefined,
): Record<string, number> | null {
  if (!baseStats) return null;
  if (!override) return baseStats;
  const next = { ...baseStats };
  for (const row of BASE_STAT_ROWS) {
    const ov = override[row.statName];
    if (typeof ov === "number" && Number.isFinite(ov)) {
      next[row.statName] = ov;
    }
  }
  return next;
}

function isAegislashName(name: string): boolean {
  const n = name.trim();
  return n === "킬가르도" || n.startsWith("킬가르도(");
}

function applyAegislashStanceBaseStatOverride(
  baseStats: Record<string, number> | null,
  pokemonName: string,
  moveId: number | null,
  moveMeta: MoveMeta | null,
): Record<string, number> | null {
  if (!baseStats) return null;
  if (!isAegislashName(pokemonName)) return baseStats;
  if (moveId === KINGS_SHIELD_MOVE_ID) {
    return applyBaseStatOverride(baseStats, AEGISLASH_SHIELD_BASE_STATS);
  }
  const damageClass = (moveMeta?.damageClass ?? "").trim().toLowerCase();
  if (damageClass === "physical" || damageClass === "special") {
    return applyBaseStatOverride(baseStats, AEGISLASH_BLADE_BASE_STATS);
  }
  if (damageClass === "status") {
    return applyBaseStatOverride(baseStats, AEGISLASH_SHIELD_BASE_STATS);
  }
  return baseStats;
}

function usePokemonByKoreanName(selectedName: string) {
  const [data, setData] = useState<PokemonApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedName = selectedName.trim();
    if (!normalizedName) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const pokemonId = safeGetPokemonIdByKoreanName(normalizedName);
    if (!pokemonId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setData(null);
    setError(null);
    setIsLoading(true);

    void (async () => {
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!response.ok) {
          throw new Error(`불러오기 실패 (${response.status})`);
        }
        const json = (await response.json()) as PokemonApiResponse;
        setData(json);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError("포켓몬 정보를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedName]);

  return { data, isLoading, error };
}

function StatValueCard({
  label,
  value,
  isLoading,
  evInputId,
  evValue,
  onEvChange,
}: {
  label: string;
  value: number | null;
  isLoading: boolean;
  evInputId: string;
  evValue: number;
  onEvChange: (next: number) => void;
}) {
  const surface =
    "flex h-full min-h-[4.75rem] flex-col rounded-2xl border border-black/[.12] bg-neutral-50 pl-4 pr-3 pb-3 pt-4 dark:border-white/[.16] dark:bg-neutral-900/90";
  const legendBg = "bg-transparent px-1.5";

  return (
    <div className={`relative ${surface}`}>
      <span
        className={`${baeminJua.className} absolute left-3 top-0 z-10 -translate-y-1/2 text-xs font-medium text-neutral-600 ${legendBg} dark:text-neutral-400`}
      >
        {label}
      </span>
      <div className="flex min-h-[2.5rem] items-center gap-2">
        <p className="flex flex-1 min-w-0 items-center justify-center text-xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
          {isLoading ? "…" : value != null ? value : "—"}
        </p>
        <EvInputBox
          id={evInputId}
          label={label}
          value={evValue}
          maxValue={POC_MAX_EV_TERM}
          compact
          onChange={onEvChange}
        />
      </div>
    </div>
  );
}

function Level50StatCards({
  stats,
  isLoading,
  evMap,
  onEvChange,
  natureKey,
  onNatureChange,
  evInputIdPrefix,
}: {
  stats: Record<string, number> | null;
  isLoading: boolean;
  evMap: EvMap;
  onEvChange: (stat: StatName, value: number) => void;
  natureKey: string;
  onNatureChange: (natureKey: string) => void;
  evInputIdPrefix: string;
}) {
  const matrixHeaderClass =
    "border border-black/[.08] px-1.5 py-1 text-center text-[11px] font-semibold text-neutral-700 dark:border-white/[.12] dark:text-neutral-200";
  const matrixCellClass =
    "border border-black/[.08] p-0 dark:border-white/[.12]";

  return (
    <div className="mt-3 w-full" aria-label="50레벨 실스탯">
      <div className="rounded-xl border border-black/[.1] bg-neutral-50/90 p-2 dark:border-white/[.14] dark:bg-neutral-900/50">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            성격 보정표
          </p>
          <button
            type="button"
            onClick={() => onNatureChange(DEFAULT_NATURE_KEY)}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              natureKey === DEFAULT_NATURE_KEY
                ? "cursor-default border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500 dark:text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
            disabled={natureKey === DEFAULT_NATURE_KEY}
          >
            무보정 (x1.0)
          </button>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={matrixHeaderClass} />
              {NON_HP_STATS.map((stat) => (
                <th key={`up-${stat}`} className={matrixHeaderClass}>
                  +{STAT_LABEL_BY_NAME[stat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NON_HP_STATS.map((downStat) => (
              <tr key={`row-${downStat}`}>
                <th className={matrixHeaderClass}>-{STAT_LABEL_BY_NAME[downStat]}</th>
                {NON_HP_STATS.map((upStat) => {
                  if (upStat === downStat) {
                    return (
                      <td
                        key={`${downStat}-${upStat}`}
                        className={`${matrixCellClass} bg-neutral-200`}
                      />
                    );
                  }
                  const cellNature = getNatureByUpDown(upStat, downStat);
                  const isActive = cellNature.key === natureKey;
                  return (
                    <td key={`${downStat}-${upStat}`} className={matrixCellClass}>
                      <button
                        type="button"
                        onClick={() => onNatureChange(cellNature.key)}
                        className={`w-full px-1 py-1 text-center text-[11px] transition ${
                          isActive
                            ? "bg-violet-600 text-white"
                            : "bg-white text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        }`}
                        aria-pressed={isActive}
                      >
                        {getNatureShortLabel(cellNature)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {BASE_STAT_ROWS.map((row) => (
          <div key={row.statName} className="min-w-0">
            <StatValueCard
              label={row.label}
              value={stats?.[row.statName] ?? null}
              isLoading={isLoading}
              evInputId={`${evInputIdPrefix}-${row.statName}`}
              evValue={evMap[row.statName]}
              onEvChange={(v) => onEvChange(row.statName, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 포켓몬 게임 페이지 `?detail=damage` 본문 */
export function PokemonDamageCalcPage() {
  const [attackerName, setAttackerName] = useState("");
  const [defenderName, setDefenderName] = useState("");
  const [attackerEv, setAttackerEv] = useState<EvMap>(defaultEvMap);
  const [defenderEv, setDefenderEv] = useState<EvMap>(defaultEvMap);
  const [attackerMove, setAttackerMove] = useState("");
  const [defenderMove, setDefenderMove] = useState("");
  const [attackerSelectedMoveMeta, setAttackerSelectedMoveMeta] =
    useState<MoveMeta | null>(null);
  const [defenderSelectedMoveMeta, setDefenderSelectedMoveMeta] =
    useState<MoveMeta | null>(null);
  const [attackerNatureKey, setAttackerNatureKey] = useState(DEFAULT_NATURE_KEY);
  const [defenderNatureKey, setDefenderNatureKey] = useState(DEFAULT_NATURE_KEY);
  const [attackerRotomForm, setAttackerRotomForm] = useState<RotomFormKey>("base");
  const [defenderRotomForm, setDefenderRotomForm] = useState<RotomFormKey>("base");
  const [attackerCharizardForm, setAttackerCharizardForm] =
    useState<CharizardFormKey>("base");
  const [defenderCharizardForm, setDefenderCharizardForm] =
    useState<CharizardFormKey>("base");
  const [attackerAttackRank, setAttackerAttackRank] = useState<RankStage>(0);
  const [attackerSpecialAttackRank, setAttackerSpecialAttackRank] =
    useState<RankStage>(0);
  const [attackerDefenseRank, setAttackerDefenseRank] = useState<RankStage>(0);
  const [attackerSpecialDefenseRank, setAttackerSpecialDefenseRank] =
    useState<RankStage>(0);
  const [defenderAttackRank, setDefenderAttackRank] = useState<RankStage>(0);
  const [defenderSpecialAttackRank, setDefenderSpecialAttackRank] =
    useState<RankStage>(0);
  const [defenderDefenseRank, setDefenderDefenseRank] = useState<RankStage>(0);
  const [defenderSpecialDefenseRank, setDefenderSpecialDefenseRank] =
    useState<RankStage>(0);
  const [isCritical, setIsCritical] = useState(false);
  const [forceStab, setForceStab] = useState(false);
  const [weather, setWeather] = useState<WeatherKind>("none");
  const [dbMoveById, setDbMoveById] = useState<Map<number, WaldoMoveRow>>(
    () => new Map(),
  );
  const [dbMovesError, setDbMovesError] = useState<string | null>(null);

  const attacker = usePokemonByKoreanName(attackerName);
  const defender = usePokemonByKoreanName(defenderName);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await apiFetch("/api/waldo/games/pokemon/moves", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const rows = (await res.json()) as WaldoMoveRow[];
        const next = new Map<number, WaldoMoveRow>();
        for (const r of Array.isArray(rows) ? rows : []) {
          const id = waldoMoveRowId(r);
          if (id != null) {
            next.set(id, r);
          }
        }
        if (!controller.signal.aborted) {
          setDbMoveById(next);
          setDbMovesError(null);
        }
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        if (!controller.signal.aborted) {
          setDbMovesError(
            "기술 DB(T_POKEMON_MOVE)를 불러오지 못했습니다. 백엔드·동기화를 확인해 주세요.",
          );
        }
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setAttackerEv(defaultEvMap());
    setAttackerNatureKey(DEFAULT_NATURE_KEY);
    setAttackerMove("");
    setAttackerSelectedMoveMeta(null);
    setAttackerRotomForm("base");
    setAttackerCharizardForm("base");
    setAttackerAttackRank(0);
    setAttackerSpecialAttackRank(0);
    setAttackerDefenseRank(0);
    setAttackerSpecialDefenseRank(0);
  }, [attacker.data?.id]);

  useEffect(() => {
    setDefenderEv(defaultEvMap());
    setDefenderNatureKey(DEFAULT_NATURE_KEY);
    setDefenderMove("");
    setDefenderSelectedMoveMeta(null);
    setDefenderRotomForm("base");
    setDefenderCharizardForm("base");
    setDefenderAttackRank(0);
    setDefenderSpecialAttackRank(0);
    setDefenderDefenseRank(0);
    setDefenderSpecialDefenseRank(0);
  }, [defender.data?.id]);

  const attackerIsRotom = useMemo(() => isRotomName(attackerName), [attackerName]);
  const defenderIsRotom = useMemo(() => isRotomName(defenderName), [defenderName]);
  const attackerIsCharizard = useMemo(() => isCharizardName(attackerName), [attackerName]);
  const defenderIsCharizard = useMemo(() => isCharizardName(defenderName), [defenderName]);
  const attackerCharizardOverride = useMemo(
    () => (attackerIsCharizard ? getCharizardFormOverride(attackerCharizardForm) : undefined),
    [attackerIsCharizard, attackerCharizardForm],
  );
  const defenderCharizardOverride = useMemo(
    () => (defenderIsCharizard ? getCharizardFormOverride(defenderCharizardForm) : undefined),
    [defenderIsCharizard, defenderCharizardForm],
  );
  const attackerTypeNames = useMemo(
    () =>
      attackerIsRotom
        ? getRotomFormTypes(attackerRotomForm)
        : attackerCharizardOverride?.types?.length
          ? attackerCharizardOverride.types
        : getPokemonTypeNames(attacker.data),
    [attackerIsRotom, attackerRotomForm, attackerCharizardOverride, attacker.data],
  );
  const defenderTypeNames = useMemo(
    () =>
      defenderIsRotom
        ? getRotomFormTypes(defenderRotomForm)
        : defenderCharizardOverride?.types?.length
          ? defenderCharizardOverride.types
        : getPokemonTypeNames(defender.data),
    [defenderIsRotom, defenderRotomForm, defenderCharizardOverride, defender.data],
  );
  const attackerMoveId = Number.isFinite(Number(attackerMove)) ? Number(attackerMove) : null;
  const defenderMoveId = Number.isFinite(Number(defenderMove)) ? Number(defenderMove) : null;

  const attackerStats = level50StatsFromBases(
    applyAegislashStanceBaseStatOverride(
      applyBaseStatOverride(
        statsRecordFromPokemon(attacker.data),
        attackerCharizardOverride?.baseStats,
      ),
      attackerName,
      attackerMoveId,
      attackerSelectedMoveMeta,
    ),
    attackerEv,
    attackerNatureKey,
  );
  const attackerCardStyle = useMemo(
    () => cardStyleByPokemonTypes(attackerTypeNames),
    [attackerTypeNames],
  );
  const attackerMoveOptions = useMemo(() => {
    const base = learnsetMovesMatchingDb(attacker.data?.moves, dbMoveById);
    if (!attackerIsRotom) return base;
    return applyRotomFormMoveOverrides(base, dbMoveById, attackerRotomForm);
  }, [
    attacker.data?.id,
    attacker.data?.moves,
    dbMoveById,
    attackerIsRotom,
    attackerRotomForm,
  ]);
  const attackerMoveComboboxOptions = useMemo(
    () =>
      attackerMoveOptions.map((move) => ({
        value: String(move.moveId),
        label: move.label,
      })),
    [attackerMoveOptions],
  );
  const defenderStats = level50StatsFromBases(
    applyAegislashStanceBaseStatOverride(
      applyBaseStatOverride(
        statsRecordFromPokemon(defender.data),
        defenderCharizardOverride?.baseStats,
      ),
      defenderName,
      defenderMoveId,
      defenderSelectedMoveMeta,
    ),
    defenderEv,
    defenderNatureKey,
  );
  const defenderCardStyle = useMemo(
    () => cardStyleByPokemonTypes(defenderTypeNames),
    [defenderTypeNames],
  );
  const defenderMoveOptions = useMemo(() => {
    const base = learnsetMovesMatchingDb(defender.data?.moves, dbMoveById);
    if (!defenderIsRotom) return base;
    return applyRotomFormMoveOverrides(base, dbMoveById, defenderRotomForm);
  }, [
    defender.data?.id,
    defender.data?.moves,
    dbMoveById,
    defenderIsRotom,
    defenderRotomForm,
  ]);
  const defenderMoveComboboxOptions = useMemo(
    () =>
      defenderMoveOptions.map((move) => ({
        value: String(move.moveId),
        label: move.label,
      })),
    [defenderMoveOptions],
  );

  useEffect(() => {
    if (!attackerMove) {
      setAttackerSelectedMoveMeta(null);
      return;
    }
    const id = Number(attackerMove);
    if (!Number.isFinite(id)) {
      setAttackerSelectedMoveMeta(null);
      return;
    }
    const selected = attackerMoveOptions.find((m) => m.moveId === id);
    setAttackerSelectedMoveMeta(selected?.meta ?? null);
  }, [attackerMove, attackerMoveOptions]);

  useEffect(() => {
    if (!defenderMove) {
      setDefenderSelectedMoveMeta(null);
      return;
    }
    const id = Number(defenderMove);
    if (!Number.isFinite(id)) {
      setDefenderSelectedMoveMeta(null);
      return;
    }
    const selected = defenderMoveOptions.find((m) => m.moveId === id);
    setDefenderSelectedMoveMeta(selected?.meta ?? null);
  }, [defenderMove, defenderMoveOptions]);

  const attackerDamageSummary = useMemo(
    () =>
      computeDamageSummary({
        attackerStats,
        defenderStats,
        attackerTypes: attackerTypeNames,
        defenderTypes: defenderTypeNames,
        moveId: Number.isFinite(Number(attackerMove)) ? Number(attackerMove) : null,
        moveMeta: attackerSelectedMoveMeta,
        isCritical,
        forceStab,
        weather,
        attackerAttackRank,
        attackerSpecialAttackRank,
        defenderAttackRank,
        defenderSpecialAttackRank,
        defenderDefenseRank,
        defenderSpecialDefenseRank,
      }),
    [
      attackerStats,
      defenderStats,
      attackerTypeNames,
      defenderTypeNames,
      attackerMove,
      attackerSelectedMoveMeta,
      isCritical,
      forceStab,
      weather,
      attackerAttackRank,
      attackerSpecialAttackRank,
      defenderAttackRank,
      defenderSpecialAttackRank,
      defenderDefenseRank,
      defenderSpecialDefenseRank,
    ],
  );

  const box =
    "rounded-md border border-black/[.14] bg-white p-4 text-sm text-neutral-700 shadow-sm dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-300";
  /** 도감 `sm:w-72`(18rem)보다 좁게 */
  const comboboxWidth = "w-full sm:w-56";

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 text-left">
      <header>
        <h2
          className={`${baeminJua.className} text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100`}
        >
          피해량 계산
        </h2>
      </header>

      {dbMovesError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {dbMovesError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
          <div
            className={`${box} flex min-h-[220px] flex-col gap-3 md:min-h-[280px]`}
            aria-labelledby="damage-calc-attacker-title"
            style={attackerCardStyle}
          >
            <h3
              id="damage-calc-attacker-title"
              className={`${baeminJua.className} text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100`}
            >
              때리는 포켓몬
            </h3>
            <PokemonNameCombobox
              id="pokemon-damage-attacker"
              labelledBy="damage-calc-attacker-title"
              value={attackerName}
              onChange={setAttackerName}
              wrapperClassName={comboboxWidth}
            />
            {attackerIsRotom ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pokemon-damage-attacker-rotom-form"
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  로토무 폼
                </label>
                <select
                  id="pokemon-damage-attacker-rotom-form"
                  value={attackerRotomForm}
                  onChange={(e) => setAttackerRotomForm(e.target.value as RotomFormKey)}
                  className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
                >
                  {ROTOM_FORM_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {attackerIsCharizard ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pokemon-damage-attacker-charizard-form"
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  메가 폼
                </label>
                <select
                  id="pokemon-damage-attacker-charizard-form"
                  value={attackerCharizardForm}
                  onChange={(e) =>
                    setAttackerCharizardForm(e.target.value as CharizardFormKey)
                  }
                  className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
                >
                  {CHARIZARD_FORM_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {attacker.error ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {attacker.error}
              </p>
            ) : null}
            <Level50StatCards
              stats={attackerStats}
              isLoading={attacker.isLoading}
              evMap={attackerEv}
              natureKey={attackerNatureKey}
              onNatureChange={setAttackerNatureKey}
              evInputIdPrefix="pokemon-damage-attacker-ev"
              onEvChange={(stat, value) =>
                setAttackerEv((prev) => applyEvChange(prev, stat, value))
              }
            />
            <div className="mt-1">
              <label
                htmlFor="pokemon-damage-attacker-move"
                className={`${baeminJua.className} mb-0.5 block text-sm font-semibold text-neutral-800 dark:text-neutral-200`}
              >
                사용 기술
              </label>
              <MoveOptionCombobox
                id="pokemon-damage-attacker-move"
                labelledBy="damage-calc-attacker-title"
                value={attackerMove}
                onChange={setAttackerMove}
                options={attackerMoveComboboxOptions}
                disabled={attackerMoveOptions.length === 0}
                placeholder="기술을 입력하거나 목록에서 선택하세요"
                emptyText="일치하는 기술이 없습니다."
              />
              {!attacker.isLoading &&
              attacker.data &&
              attackerMoveOptions.length === 0 &&
              !dbMovesError &&
              dbMoveById.size > 0 ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  이 포켓몬 도감 기술 중 DB(T_POKEMON_MOVE)에 있는 기술이 없습니다.
                </p>
              ) : null}
              <MoveDetailPanel meta={attackerSelectedMoveMeta} />
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <RankSelect
                    id="pokemon-damage-attacker-attack-rank"
                    label="공격 랭크"
                    value={attackerAttackRank}
                    onChange={setAttackerAttackRank}
                  />
                  <RankSelect
                    id="pokemon-damage-attacker-special-attack-rank"
                    label="특공 랭크"
                    value={attackerSpecialAttackRank}
                    onChange={setAttackerSpecialAttackRank}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RankSelect
                    id="pokemon-damage-attacker-defense-rank"
                    label="방어 랭크"
                    value={attackerDefenseRank}
                    onChange={setAttackerDefenseRank}
                  />
                  <RankSelect
                    id="pokemon-damage-attacker-special-defense-rank"
                    label="특방 랭크"
                    value={attackerSpecialDefenseRank}
                    onChange={setAttackerSpecialDefenseRank}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${box} flex min-h-[220px] flex-col gap-3 md:min-h-[280px]`}
            aria-labelledby="damage-calc-defender-title"
            style={defenderCardStyle}
          >
            <h3
              id="damage-calc-defender-title"
              className={`${baeminJua.className} text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100`}
            >
              맞는 포켓몬
            </h3>
            <PokemonNameCombobox
              id="pokemon-damage-defender"
              labelledBy="damage-calc-defender-title"
              value={defenderName}
              onChange={setDefenderName}
              wrapperClassName={comboboxWidth}
            />
            {defenderIsRotom ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pokemon-damage-defender-rotom-form"
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  로토무 폼
                </label>
                <select
                  id="pokemon-damage-defender-rotom-form"
                  value={defenderRotomForm}
                  onChange={(e) => setDefenderRotomForm(e.target.value as RotomFormKey)}
                  className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
                >
                  {ROTOM_FORM_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {defenderIsCharizard ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pokemon-damage-defender-charizard-form"
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  메가 폼
                </label>
                <select
                  id="pokemon-damage-defender-charizard-form"
                  value={defenderCharizardForm}
                  onChange={(e) =>
                    setDefenderCharizardForm(e.target.value as CharizardFormKey)
                  }
                  className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
                >
                  {CHARIZARD_FORM_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {defender.error ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {defender.error}
              </p>
            ) : null}
            <Level50StatCards
              stats={defenderStats}
              isLoading={defender.isLoading}
              evMap={defenderEv}
              natureKey={defenderNatureKey}
              onNatureChange={setDefenderNatureKey}
              evInputIdPrefix="pokemon-damage-defender-ev"
              onEvChange={(stat, value) =>
                setDefenderEv((prev) => applyEvChange(prev, stat, value))
              }
            />
            <div className="mt-1">
              <label
                htmlFor="pokemon-damage-defender-move"
                className={`${baeminJua.className} mb-0.5 block text-sm font-semibold text-neutral-800 dark:text-neutral-200`}
              >
                사용 기술
              </label>
              <MoveOptionCombobox
                id="pokemon-damage-defender-move"
                labelledBy="damage-calc-defender-title"
                value={defenderMove}
                onChange={setDefenderMove}
                options={defenderMoveComboboxOptions}
                disabled={defenderMoveOptions.length === 0}
                placeholder="기술을 입력하거나 목록에서 선택하세요"
                emptyText="일치하는 기술이 없습니다."
              />
              {!defender.isLoading &&
              defender.data &&
              defenderMoveOptions.length === 0 &&
              !dbMovesError &&
              dbMoveById.size > 0 ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  이 포켓몬 도감 기술 중 DB(T_POKEMON_MOVE)에 있는 기술이 없습니다.
                </p>
              ) : null}
              <MoveDetailPanel meta={defenderSelectedMoveMeta} />
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <RankSelect
                    id="pokemon-damage-defender-attack-rank"
                    label="공격 랭크"
                    value={defenderAttackRank}
                    onChange={setDefenderAttackRank}
                  />
                  <RankSelect
                    id="pokemon-damage-defender-special-attack-rank"
                    label="특공 랭크"
                    value={defenderSpecialAttackRank}
                    onChange={setDefenderSpecialAttackRank}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RankSelect
                    id="pokemon-damage-defender-defense-rank"
                    label="방어 랭크"
                    value={defenderDefenseRank}
                    onChange={setDefenderDefenseRank}
                  />
                  <RankSelect
                    id="pokemon-damage-defender-special-defense-rank"
                    label="특방 랭크"
                    value={defenderSpecialDefenseRank}
                    onChange={setDefenderSpecialDefenseRank}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${box} min-h-[120px] w-full md:min-h-[140px]`}
          aria-label="결과·요약 영역"
        >
          <h3 className={`${baeminJua.className} text-base font-semibold text-neutral-900 dark:text-neutral-100`}>
            피해량 결과
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-black/[.08] bg-neutral-50/80 px-3 py-2 text-xs dark:border-white/[.14] dark:bg-neutral-900/60">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={forceStab}
                onChange={(e) => setForceStab(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
              />
              자속(강제)
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
              />
              급소
            </label>
            {(["sunny", "rain", "sandstorm", "snow"] as WeatherKind[]).map((w) => (
              <label
                key={w}
                className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300"
              >
                <input
                  type="checkbox"
                  checked={weather === w}
                  onChange={(e) => {
                    if (e.target.checked) setWeather(w);
                    else setWeather("none");
                  }}
                  className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
                />
                {weatherLabel(w)}
              </label>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-md border border-black/[.08] bg-neutral-50/80 p-3 dark:border-white/[.14] dark:bg-neutral-900/60">
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                때리는 포켓몬 → 맞는 포켓몬
              </p>
              {attackerDamageSummary ? (
                <>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                    {attackerDamageSummary.minDamage} ~ {attackerDamageSummary.maxDamage} (
                    {attackerDamageSummary.minPercent.toFixed(1)}% ~{" "}
                    {attackerDamageSummary.maxPercent.toFixed(1)}%)
                  </p>
                  {attackerDamageSummary.ruleNote ? (
                    <p className="mt-1 text-[11px] text-violet-700 dark:text-violet-300">
                      특수 룰: {attackerDamageSummary.ruleNote}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    자속 x{attackerDamageSummary.stab.toFixed(1)} · 급소 x
                    {attackerDamageSummary.critical.toFixed(1)} · 날씨 x
                    {attackerDamageSummary.weather.toFixed(1)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  양쪽 포켓몬과 기술(위력/공격형태 포함)을 선택하면 계산됩니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

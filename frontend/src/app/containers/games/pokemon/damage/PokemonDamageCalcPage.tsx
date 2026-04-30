"use client";

import { Jua } from "next/font/google";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import pokemon from "pokemon";

import {
  BASE_STAT_ROWS,
  DEFAULT_NATURE_KEY,
  POC_MAX_EV_TERM,
  getNatureModifier,
  type EvMap,
  type StatName,
} from "./components/Level50StatCards";
import { type RankStage } from "./components/RankControls";
import { PokemonBattleSideCard } from "./components/PokemonBattleSideCard";
import { DamageResultCard } from "./components/DamageResultCard";
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

/** 능력치별 노력치 합산 상한 */
const POC_MAX_EV_TOTAL = 66;

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
          <PokemonBattleSideCard
            cardClassName={`${box} flex min-h-[220px] flex-col gap-3 md:min-h-[280px]`}
            titleId="damage-calc-attacker-title"
            title="때리는 포켓몬"
            cardStyle={attackerCardStyle}
            fontClassName={baeminJua.className}
            nameInputId="pokemon-damage-attacker"
            name={attackerName}
            onChangeName={setAttackerName}
            nameComboboxWidthClassName={comboboxWidth}
            showRotomForm={attackerIsRotom}
            rotomFormId="pokemon-damage-attacker-rotom-form"
            rotomFormValue={attackerRotomForm}
            rotomFormOptions={ROTOM_FORM_OPTIONS}
            onChangeRotomForm={(value) => setAttackerRotomForm(value as RotomFormKey)}
            showCharizardForm={attackerIsCharizard}
            charizardFormId="pokemon-damage-attacker-charizard-form"
            charizardFormValue={attackerCharizardForm}
            charizardFormOptions={CHARIZARD_FORM_OPTIONS}
            onChangeCharizardForm={(value) =>
              setAttackerCharizardForm(value as CharizardFormKey)
            }
            error={attacker.error}
            stats={attackerStats}
            isLoading={attacker.isLoading}
            evMap={attackerEv}
            natureKey={attackerNatureKey}
            onNatureChange={setAttackerNatureKey}
            evInputIdPrefix="pokemon-damage-attacker-ev"
            onEvChange={(stat, value) =>
              setAttackerEv((prev) => applyEvChange(prev, stat, value))
            }
            moveInputId="pokemon-damage-attacker-move"
            moveValue={attackerMove}
            onChangeMove={setAttackerMove}
            moveOptions={attackerMoveComboboxOptions}
            isMoveDisabled={attackerMoveOptions.length === 0}
            showDbMissingMoveHint={
              !attacker.isLoading &&
              Boolean(attacker.data) &&
              attackerMoveOptions.length === 0 &&
              !dbMovesError &&
              dbMoveById.size > 0
            }
            moveDetail={<MoveDetailPanel meta={attackerSelectedMoveMeta} />}
            rankIdPrefix="pokemon-damage-attacker"
            attackRank={attackerAttackRank}
            specialAttackRank={attackerSpecialAttackRank}
            defenseRank={attackerDefenseRank}
            specialDefenseRank={attackerSpecialDefenseRank}
            onAttackRankChange={setAttackerAttackRank}
            onSpecialAttackRankChange={setAttackerSpecialAttackRank}
            onDefenseRankChange={setAttackerDefenseRank}
            onSpecialDefenseRankChange={setAttackerSpecialDefenseRank}
          />
          <PokemonBattleSideCard
            cardClassName={`${box} flex min-h-[220px] flex-col gap-3 md:min-h-[280px]`}
            titleId="damage-calc-defender-title"
            title="맞는 포켓몬"
            cardStyle={defenderCardStyle}
            fontClassName={baeminJua.className}
            nameInputId="pokemon-damage-defender"
            name={defenderName}
            onChangeName={setDefenderName}
            nameComboboxWidthClassName={comboboxWidth}
            showRotomForm={defenderIsRotom}
            rotomFormId="pokemon-damage-defender-rotom-form"
            rotomFormValue={defenderRotomForm}
            rotomFormOptions={ROTOM_FORM_OPTIONS}
            onChangeRotomForm={(value) => setDefenderRotomForm(value as RotomFormKey)}
            showCharizardForm={defenderIsCharizard}
            charizardFormId="pokemon-damage-defender-charizard-form"
            charizardFormValue={defenderCharizardForm}
            charizardFormOptions={CHARIZARD_FORM_OPTIONS}
            onChangeCharizardForm={(value) =>
              setDefenderCharizardForm(value as CharizardFormKey)
            }
            error={defender.error}
            stats={defenderStats}
            isLoading={defender.isLoading}
            evMap={defenderEv}
            natureKey={defenderNatureKey}
            onNatureChange={setDefenderNatureKey}
            evInputIdPrefix="pokemon-damage-defender-ev"
            onEvChange={(stat, value) =>
              setDefenderEv((prev) => applyEvChange(prev, stat, value))
            }
            moveInputId="pokemon-damage-defender-move"
            moveValue={defenderMove}
            onChangeMove={setDefenderMove}
            moveOptions={defenderMoveComboboxOptions}
            isMoveDisabled={defenderMoveOptions.length === 0}
            showDbMissingMoveHint={
              !defender.isLoading &&
              Boolean(defender.data) &&
              defenderMoveOptions.length === 0 &&
              !dbMovesError &&
              dbMoveById.size > 0
            }
            moveDetail={<MoveDetailPanel meta={defenderSelectedMoveMeta} />}
            rankIdPrefix="pokemon-damage-defender"
            attackRank={defenderAttackRank}
            specialAttackRank={defenderSpecialAttackRank}
            defenseRank={defenderDefenseRank}
            specialDefenseRank={defenderSpecialDefenseRank}
            onAttackRankChange={setDefenderAttackRank}
            onSpecialAttackRankChange={setDefenderSpecialAttackRank}
            onDefenseRankChange={setDefenderDefenseRank}
            onSpecialDefenseRankChange={setDefenderSpecialDefenseRank}
          />
        </div>
        <DamageResultCard
          cardClassName={`${box} min-h-[120px] w-full md:min-h-[140px]`}
          fontClassName={baeminJua.className}
          forceStab={forceStab}
          onChangeForceStab={setForceStab}
          isCritical={isCritical}
          onChangeIsCritical={setIsCritical}
          weather={weather}
          onChangeWeather={setWeather}
          attackerDamageSummary={attackerDamageSummary}
        />
      </div>
    </div>
  );
}

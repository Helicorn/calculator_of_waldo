import type { ChampionSpell } from "@/app/types/games/lol";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTooltipNumber(n: number): string {
  if (!Number.isFinite(n)) return "?";
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-6) {
    return String(Math.round(n));
  }
  const t = Math.round(n * 100) / 100;
  return String(t);
}

/** "55/65/75" 형태에서 슬래시 구간 숫자 배열 */
function parseSlashNumbers(burn: string | undefined): number[] | null {
  if (burn == null || burn === "") return null;
  const parts = burn.split("/").map((p) => parseFloat(p.trim()));
  if (!parts.length || !parts.every((n) => Number.isFinite(n))) return null;
  return parts;
}

function valueAtRank(values: number[] | null | undefined, rank: number): number | null {
  if (!values?.length) return null;
  const v = values[rank] ?? values[0];
  return v !== undefined && Number.isFinite(v) ? v : null;
}

function valueAtRankNext(values: number[] | null | undefined, rank: number): number | null {
  if (!values?.length) return null;
  const v = values[rank + 1];
  return v !== undefined && Number.isFinite(v) ? v : null;
}

function effectValue(
  effect: (number[] | null)[] | undefined,
  row: number,
  rank: number,
): number | null {
  const r = effect?.[row];
  if (!r || r[rank] === undefined || r[rank] === null) return null;
  const v = r[rank];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function fromSlashBurn(
  burn: string | null | undefined,
  rank: number,
): number | null {
  if (burn == null || burn === "") return null;
  return valueAtRank(parseSlashNumbers(burn) ?? undefined, rank);
}

function fromSlashBurnNext(
  burn: string | null | undefined,
  rank: number,
): number | null {
  if (burn == null || burn === "") return null;
  return valueAtRankNext(parseSlashNumbers(burn) ?? undefined, rank);
}

function parseRangeBurnValues(rangeBurn: string | undefined): number[] | null {
  return parseSlashNumbers(rangeBurn);
}

/**
 * 스킬 JSON에서 툴팁 `{{ … }}` 치환에 쓸 숫자 맵 (키는 소문자)
 * 기본 스킬 랭크 1(rankIndex 0) 기준
 */
function buildTooltipNumberMap(spell: ChampionSpell, rank: number): Map<string, number> {
  const m = new Map<string, number>();

  const cooldown = spell.cooldown ?? parseSlashNumbers(spell.cooldownBurn) ?? undefined;
  const cost = spell.cost ?? parseSlashNumbers(spell.costBurn) ?? undefined;
  const range =
    spell.range ?? parseRangeBurnValues(spell.rangeBurn) ?? undefined;

  const setPair = (
    arr: number[] | undefined,
    key: string,
    keyNl: string,
  ) => {
    const cur = valueAtRank(arr, rank);
    if (cur !== null) m.set(key, cur);
    const next = valueAtRankNext(arr, rank);
    if (next !== null) m.set(keyNl, next);
  };

  setPair(cooldown, "cooldown", "cooldownnl");
  setPair(cost, "cost", "costnl");
  setPair(range, "range", "rangenl");

  for (let i = 1; i <= 10; i++) {
    const fromEffect = effectValue(spell.effect, i, rank);
    if (fromEffect !== null) {
      m.set(`e${i}`, fromEffect);
      continue;
    }
    const burn = spell.effectBurn?.[i];
    const fromBurn = fromSlashBurn(burn ?? null, rank);
    if (fromBurn !== null) m.set(`e${i}`, fromBurn);
  }

  const bd =
    effectValue(spell.effect, 1, rank) ??
    fromSlashBurn(spell.effectBurn?.[1] ?? null, rank);
  if (bd !== null) m.set("basedamage", bd);
  const bdNl =
    effectValue(spell.effect, 1, rank + 1) ??
    fromSlashBurnNext(spell.effectBurn?.[1] ?? null, rank);
  if (bdNl !== null) m.set("basedamagenl", bdNl);

  if (spell.datavalues && typeof spell.datavalues === "object") {
    for (const [k, v] of Object.entries(spell.datavalues)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        m.set(k.toLowerCase(), v);
      }
    }
  }

  return m;
}

function tryResolveNumericExpression(
  expr: string,
  numbers: Map<string, number>,
): string | null {
  const trimmed = expr.trim();
  const single = /^([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(trimmed);
  if (single) {
    const key = single[1].toLowerCase();
    const v = numbers.get(key);
    if (v !== undefined) return formatTooltipNumber(v);
    return null;
  }

  const sortedKeys = Array.from(numbers.keys()).sort((a, b) => b.length - a.length);
  let s = trimmed;
  for (const key of sortedKeys) {
    const val = numbers.get(key);
    if (val === undefined) continue;
    const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi");
    s = s.replace(re, () => String(val));
  }
  if (/[a-zA-Z_]/.test(s)) return null;
  try {
    const result = Function(`"use strict"; return (${s})`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return formatTooltipNumber(result);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Data Dragon 툴팁 HTML: JSON에 있는 값은 숫자(또는 자원명 문자열)로 치환하고,
 * 여전히 남는 플레이스홀더는 `?`로 둡니다.
 */
export function resolveSpellTooltip(
  html: string,
  spell: ChampionSpell,
  championPartype: string,
  rankIndex = 0,
): string {
  const maxRank = spell.maxrank ?? spell.cooldown?.length ?? spell.cost?.length ?? 5;
  const rank = Math.min(Math.max(0, rankIndex), Math.max(0, maxRank - 1));
  const numberMap = buildTooltipNumberMap(spell, rank);

  let result = html.replace(/@AbilityResourceName@/gi, escapeHtml(championPartype));

  result = result.replace(/\{\{([\s\S]*?)\}\}/g, (_full, inner: string) => {
    const innerTrim = inner.trim();
    if (/^spellmodifierdescriptionappend$/i.test(innerTrim)) return "";
    if (/^abilityresourcename$/i.test(innerTrim)) return escapeHtml(championPartype);

    const key = innerTrim.toLowerCase();
    const numVal = numberMap.get(key);
    if (numVal !== undefined) return formatTooltipNumber(numVal);

    const expr = tryResolveNumericExpression(innerTrim, numberMap);
    if (expr !== null) return expr;

    return "?";
  });

  result = result.replace(/@[A-Za-z][A-Za-z0-9_]*@/g, "?");

  return result;
}

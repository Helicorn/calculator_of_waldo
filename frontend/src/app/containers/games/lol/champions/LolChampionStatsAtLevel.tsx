"use client";

import { useState } from "react";

import type { ChampionType } from "@/app/types/games/lol";
import {
  MAX_CHAMPION_LEVEL,
  MIN_CHAMPION_LEVEL,
  type ComputedStatKey,
  COMPUTED_STAT_KEYS,
  clampChampionLevel,
  computeChampionStatsAtLevel,
  formatComputedStatValue,
} from "@/lib/lolChampionStatsAtLevel";

const LABELS: Record<ComputedStatKey, string> = {
  hp: "체력",
  mp: "마나",
  movespeed: "이동 속도",
  armor: "방어력",
  spellblock: "마법 저항력",
  attackrange: "사거리",
  hpregen: "체력 재생",
  mpregen: "마나 재생",
  crit: "치명타 확률",
  attackdamage: "공격력",
  attackspeed: "공격 속도",
};

type Props = {
  stats: ChampionType["stats"];
};

export function LolChampionStatsAtLevel({ stats }: Props) {
  const [levelStr, setLevelStr] = useState(String(MAX_CHAMPION_LEVEL));

  const parsed = Number.parseInt(levelStr, 10);
  const level = Number.isFinite(parsed)
    ? clampChampionLevel(parsed)
    : MIN_CHAMPION_LEVEL;
  const computed = computeChampionStatsAtLevel(stats, level);

  return (
    <section className="mt-2 border-t border-black/[.08] pt-6 dark:border-white/[.12]">
      <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        레벨별 계산 능력치
      </h2>
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-500">
        솔랭 기본 성장만 반영합니다. 룬·아이템·스킬·버프는 포함되지 않습니다. 공격
        속도는 레벨당 증가율(%)을 곱하는 방식입니다.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label
          htmlFor="champion-level-input"
          className="text-sm text-neutral-600 dark:text-neutral-400"
        >
          레벨
        </label>
        <input
          id="champion-level-input"
          type="number"
          inputMode="numeric"
          min={MIN_CHAMPION_LEVEL}
          max={MAX_CHAMPION_LEVEL}
          value={levelStr}
          onChange={(e) => setLevelStr(e.target.value)}
          onBlur={() => {
            const n = Number.parseInt(levelStr, 10);
            if (!Number.isFinite(n)) {
              setLevelStr(String(MIN_CHAMPION_LEVEL));
              return;
            }
            setLevelStr(String(clampChampionLevel(n)));
          }}
          className="w-20 rounded-md border border-black/[.12] bg-[var(--background)] px-2 py-1.5 font-mono text-sm text-neutral-900 tabular-nums outline-none ring-offset-2 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/30 dark:border-white/[.18] dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-500">
          ({MIN_CHAMPION_LEVEL}–{MAX_CHAMPION_LEVEL})
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {COMPUTED_STAT_KEYS.map((key) => (
          <div
            key={key}
            className="flex justify-between gap-4 border-b border-black/[.06] py-1 dark:border-white/[.08]"
          >
            <dt className="text-neutral-600 dark:text-neutral-400">
              {LABELS[key]}
            </dt>
            <dd className="shrink-0 font-mono text-neutral-900 dark:text-neutral-100">
              {formatComputedStatValue(key, computed[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

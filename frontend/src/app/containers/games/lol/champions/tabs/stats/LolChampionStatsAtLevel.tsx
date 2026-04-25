"use client";

import { useState } from "react";

import type { ChampionType } from "@/app/types/games/lol";
import { LolChampionRoleStars } from "../../LolChampionRoleStars";
import {
  MAX_CHAMPION_LEVEL,
  MIN_CHAMPION_LEVEL,
  type ComputedStatKey,
  COMPUTED_STAT_KEYS,
  clampChampionLevel,
  computeChampionStatsAtLevel,
  formatComputedStatValue,
} from "@/lib/lolChampionStatsAtLevel";

const INFO_LABELS: Record<
  keyof ChampionType["info"],
  string
> = {
  attack: "공격",
  defense: "방어",
  magic: "마법",
  difficulty: "난이도",
};

const STAT_LABELS: Record<keyof ChampionType["stats"], string> = {
  hp: "체력",
  hpperlevel: "체력 (레벨당)",
  mp: "마나",
  mpperlevel: "마나 (레벨당)",
  movespeed: "이동 속도",
  armor: "방어력",
  armorperlevel: "방어력 (레벨당)",
  spellblock: "마법 저항력",
  spellblockperlevel: "마법 저항 (레벨당)",
  attackrange: "사거리",
  hpregen: "체력 재생",
  hpregenperlevel: "체력 재생 (레벨당)",
  mpregen: "마나 재생",
  mpregenperlevel: "마나 재생 (레벨당)",
  crit: "치명타 확률",
  critperlevel: "치명타 (레벨당)",
  attackdamage: "공격력",
  attackdamageperlevel: "공격력 (레벨당)",
  attackspeed: "공격 속도",
  attackspeedperlevel: "공격 속도 (레벨당)",
};

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

type LolChampionStatsTabContentProps = {
  champion: ChampionType;
};

export function LolChampionStatsTabContent({
  champion,
}: LolChampionStatsTabContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          역할 지표
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          {(Object.keys(champion.info) as (keyof ChampionType["info"])[]).map((key) => (
            <div key={key}>
              <dt className="text-neutral-500 dark:text-neutral-400">
                {INFO_LABELS[key]}
              </dt>
              <dd className="mt-1">
                <LolChampionRoleStars
                  value={champion.info[key]}
                  label={INFO_LABELS[key]}
                />
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          레벨 1 기준 수치
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {(Object.keys(champion.stats) as (keyof ChampionType["stats"])[]).map((key) => (
            <div
              key={key}
              className="flex justify-between gap-4 border-b border-black/[.06] py-1 dark:border-white/[.08]"
            >
              <dt className="text-neutral-600 dark:text-neutral-400">
                {STAT_LABELS[key]}
              </dt>
              <dd className="shrink-0 font-mono text-neutral-900 dark:text-neutral-100">
                {champion.stats[key]}
              </dd>
            </div>
          ))}
        </dl>
        <LolChampionStatsAtLevel stats={champion.stats} />
      </section>
    </div>
  );
}

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

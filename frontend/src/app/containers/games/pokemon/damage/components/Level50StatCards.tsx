"use client";

import { EvInputBox } from "../../components/EvInputBox";

export const BASE_STAT_ROWS = [
  { statName: "hp", label: "체력" },
  { statName: "attack", label: "공격" },
  { statName: "defense", label: "방어" },
  { statName: "special-attack", label: "특공" },
  { statName: "special-defense", label: "특방" },
  { statName: "speed", label: "스피드" },
] as const;

export type StatName = (typeof BASE_STAT_ROWS)[number]["statName"];
export type EvMap = Record<StatName, number>;
type NonHpStatName = Exclude<StatName, "hp">;
type NatureEntry = {
  key: string;
  label: string;
  up?: NonHpStatName;
  down?: NonHpStatName;
};

/** 포챔스식: 공식의 floor(노력치/4) 항에 0~32 정수를 그대로 사용 */
export const POC_MAX_EV_TERM = 32;
export const DEFAULT_NATURE_KEY = "hardy";

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

export function getNatureModifier(natureKey: string, statName: StatName): number {
  if (statName === "hp") return 1;
  const nature = getNatureByKey(natureKey);
  if (nature.up === statName) return 1.1;
  if (nature.down === statName) return 0.9;
  return 1;
}

function StatValueCard({
  label,
  value,
  isLoading,
  evInputId,
  evValue,
  onEvChange,
  fontClassName,
}: {
  label: string;
  value: number | null;
  isLoading: boolean;
  evInputId: string;
  evValue: number;
  onEvChange: (next: number) => void;
  fontClassName: string;
}) {
  const surface =
    "flex h-full min-h-[4.75rem] flex-col rounded-2xl border border-black/[.12] bg-neutral-50 pl-4 pr-3 pb-3 pt-4 dark:border-white/[.16] dark:bg-neutral-900/90";
  const legendBg = "bg-transparent px-1.5";

  return (
    <div className={`relative ${surface}`}>
      <span
        className={`${fontClassName} absolute left-3 top-0 z-10 -translate-y-1/2 text-xs font-medium text-neutral-600 ${legendBg} dark:text-neutral-400`}
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

export function Level50StatCards({
  stats,
  isLoading,
  evMap,
  onEvChange,
  natureKey,
  onNatureChange,
  evInputIdPrefix,
  fontClassName,
}: {
  stats: Record<string, number> | null;
  isLoading: boolean;
  evMap: EvMap;
  onEvChange: (stat: StatName, value: number) => void;
  natureKey: string;
  onNatureChange: (natureKey: string) => void;
  evInputIdPrefix: string;
  fontClassName: string;
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
              fontClassName={fontClassName}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

export type RankStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

const RANK_STAGE_OPTIONS: RankStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

function RankSelect({
  id,
  label,
  value,
  onChange,
  fontClassName,
}: {
  id: string;
  label: string;
  value: RankStage;
  onChange: (next: RankStage) => void;
  fontClassName: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className={`${fontClassName} text-xs font-semibold text-neutral-700 dark:text-neutral-300`}
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

export function RankControls({
  idPrefix,
  attackRank,
  specialAttackRank,
  defenseRank,
  specialDefenseRank,
  onAttackRankChange,
  onSpecialAttackRankChange,
  onDefenseRankChange,
  onSpecialDefenseRankChange,
  fontClassName,
}: {
  idPrefix: string;
  attackRank: RankStage;
  specialAttackRank: RankStage;
  defenseRank: RankStage;
  specialDefenseRank: RankStage;
  onAttackRankChange: (next: RankStage) => void;
  onSpecialAttackRankChange: (next: RankStage) => void;
  onDefenseRankChange: (next: RankStage) => void;
  onSpecialDefenseRankChange: (next: RankStage) => void;
  fontClassName: string;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <RankSelect
          id={`${idPrefix}-attack-rank`}
          label="공격 랭크"
          value={attackRank}
          onChange={onAttackRankChange}
          fontClassName={fontClassName}
        />
        <RankSelect
          id={`${idPrefix}-special-attack-rank`}
          label="특공 랭크"
          value={specialAttackRank}
          onChange={onSpecialAttackRankChange}
          fontClassName={fontClassName}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <RankSelect
          id={`${idPrefix}-defense-rank`}
          label="방어 랭크"
          value={defenseRank}
          onChange={onDefenseRankChange}
          fontClassName={fontClassName}
        />
        <RankSelect
          id={`${idPrefix}-special-defense-rank`}
          label="특방 랭크"
          value={specialDefenseRank}
          onChange={onSpecialDefenseRankChange}
          fontClassName={fontClassName}
        />
      </div>
    </div>
  );
}

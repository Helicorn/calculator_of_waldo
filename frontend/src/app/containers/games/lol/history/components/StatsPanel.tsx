import type { LookupYearStatsResult } from "../lolMatchHistoryActions";

type Props = {
  yearStatsLoading: boolean;
  yearStats: LookupYearStatsResult | null;
  statsQueueType: "solo" | "flex";
  onChangeQueueType: (value: "solo" | "flex") => void;
};

export function StatsPanel({
  yearStatsLoading,
  yearStats,
  statsQueueType,
  onChangeQueueType,
}: Props) {
  return (
    <div className="mt-3 text-xs">
      {yearStatsLoading ? (
        <p className="text-neutral-600 dark:text-neutral-400">솔랭·자랭 통계 조회 중...</p>
      ) : null}
      {yearStats ? (
        yearStats.success ? (
          <>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <p className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.12]">
                연도: <strong>{yearStats.year}</strong>
              </p>
              <p className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.12]">
                솔랭+자랭 ID(올해): <strong>{yearStats.totalMatches}</strong>건
              </p>
            </div>
            <div className="mb-2 flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="stats-queue-type"
                  value="solo"
                  checked={statsQueueType === "solo"}
                  onChange={() => onChangeQueueType("solo")}
                />
                <span>솔로랭크</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="stats-queue-type"
                  value="flex"
                  checked={statsQueueType === "flex"}
                  onChange={() => onChangeQueueType("flex")}
                />
                <span>자유랭크</span>
              </label>
            </div>
            {(() => {
              const target =
                statsQueueType === "solo" ? yearStats.soloRank : yearStats.flexRank;
              return (
                <div className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.12]">
                  <p>
                    판수: <strong>{target.matches}</strong>
                  </p>
                  <p>
                    승/패/승률: <strong>{target.wins}/{target.losses} ({target.winRate}%)</strong>
                  </p>
                  <p>
                    누적 KDA: <strong>{target.kills}/{target.deaths}/{target.assists}</strong>
                  </p>
                  <p>
                    평균 KDA: <strong>{target.avgKills}/{target.avgDeaths}/{target.avgAssists}</strong>
                  </p>
                  <p>
                    라인(탑/정글/미드/원딜/서폿): <strong>{target.laneCounts.top}/{target.laneCounts.jungle}/{target.laneCounts.mid}/{target.laneCounts.adc}/{target.laneCounts.support}</strong>
                  </p>
                </div>
              );
            })()}
          </>
        ) : (
          <p className="text-red-600 dark:text-red-400">{yearStats.error}</p>
        )
      ) : (
        <p className="text-neutral-600 dark:text-neutral-400">연간 통계 준비 중...</p>
      )}
    </div>
  );
}
